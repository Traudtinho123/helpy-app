import { evaluateMailIntake } from "@/features/mail/services/mail-intake-gate";
import { archiveGmailMessages } from "@/features/gmail/services/gmail/archive-message";
import { parseFrom, resolveSenderDisplayName, isPlaceholderSenderLabel } from "@/features/gmail/services/parse-from-header";
import {
  resolveVorgangSenderFromText,
} from "@/features/workspace/services/vorgaenge/resolve-vorgang-sender";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import {
  ingestDbVorgangBundle,
} from "@/features/vorgaenge/services/db-vorgaenge-store";
import {
  hasPersistedMailMessageId,
  rememberPersistedMailMessageId,
} from "@/features/vorgaenge/services/mail-vorgang-persist-dedup";
import type {
  CreateVorgangInput,
  CreateVorgangPriority,
  CreateVorgangStatus,
} from "@/features/vorgaenge/types/create-vorgang-types";
import {
  mapVorgangPriorityToCreate,
  resolveMailSourceFromQuelle,
} from "@/features/vorgaenge/types/create-vorgang-types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";
import { createClient } from "@/lib/supabase/client";

export type CreateVorgangClientResult =
  | {
      ok: true;
      id: string;
      created: boolean;
      liste: ListeVorgang;
      workspace: WorkspaceVorgang;
    }
  | { ok: false; error: string };

export async function createVorgangClient(
  input: Omit<CreateVorgangInput, "company_id">
): Promise<CreateVorgangClientResult> {
  const response = await fetch("/api/vorgaenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    id?: string;
    created?: boolean;
    liste?: ListeVorgang;
    workspace?: WorkspaceVorgang;
    error?: string;
  };

  if (!response.ok || !payload.ok || !payload.id || !payload.liste || !payload.workspace) {
    return {
      ok: false,
      error: payload.error ?? "Vorgang konnte nicht erstellt werden.",
    };
  }

  ingestDbVorgangBundle({
    liste: payload.liste,
    workspace: payload.workspace,
  });

  rememberPersistedMailMessageId(input.gmail_message_id);

  return {
    ok: true,
    id: payload.id,
    created: payload.created ?? true,
    liste: payload.liste,
    workspace: payload.workspace,
  };
}

function mapMailStatusToCreate(status: ListeVorgang["status"]): CreateVorgangStatus {
  if (status === "zu_archivieren") return "zu_archivieren";
  if (status === "in_bearbeitung") return "in_bearbeitung";
  if (status === "wartend") return "warten_auf_antwort";
  return "neu";
}

export async function persistMailBundleToDb(
  bundle: GmailVorgangBundle
): Promise<void> {
  if (hasPersistedMailMessageId(bundle.message.id)) {
    return;
  }

  const source = resolveMailSourceFromQuelle(bundle.liste.quelle);
  const fromHeader =
    bundle.message.from?.trim() ||
    bundle.liste.from?.trim() ||
    "";
  const bodyText =
    bundle.liste.summary?.trim() ||
    bundle.liste.snippet?.trim() ||
    bundle.message.snippet?.trim() ||
    "";

  if (bundle.liste.status === "zu_archivieren") {
    const sender = resolveVorgangSenderFromText({
      fromHeader,
      bodyText,
      subject: bundle.liste.titel,
      fallbackName: bundle.liste.kunde,
    });

    await createVorgangClient({
      source,
      titel: bundle.liste.titel,
      inhalt: bodyText || bundle.liste.titel,
      prioritaet: "niedrig",
      status: "zu_archivieren",
      gmail_message_id: bundle.message.id,
      gmail_thread_id: bundle.message.threadId ?? null,
      absender_name: sender.name || bundle.liste.kunde,
      absender_email: sender.email,
      archiv_kategorie: bundle.liste.archiveCategory ?? "spam",
    });
    rememberPersistedMailMessageId(bundle.message.id);

    if (source === "gmail" && bundle.message.id) {
      const supabase = createClient();
      const session = supabase
        ? (await supabase.auth.getSession()).data.session
        : null;
      void archiveGmailMessages(session?.provider_token, [bundle.message.id]);
    }
    return;
  }

  const intake = evaluateMailIntake({
    from: fromHeader,
    subject: bundle.liste.titel,
    snippet: bundle.liste.snippet,
    bodyPreview: bodyText,
    replyTo: bundle.message.replyTo,
    listUnsubscribe: bundle.message.listUnsubscribe,
    precedence: bundle.message.precedence,
    xMailer: bundle.message.xMailer,
    direction: bundle.message.direction,
  });
  if (!intake.shouldCreateVorgang) {
    console.warn(
      "[vorgang] Intake abgelehnt — Vorgang wird nicht gespeichert:",
      bundle.liste.titel,
      intake.reason
    );
    return;
  }

  let sender = resolveVorgangSenderFromText({
    fromHeader,
    bodyText,
    subject: bundle.liste.titel,
    fallbackName: bundle.liste.kunde,
  });

  if (!sender.email) {
    console.warn(
      "[vorgang] Kein Absender erkennbar — Vorgang wird nicht gespeichert:",
      bundle.liste.titel
    );
    return;
  }

  if (
    !sender.name ||
    isPlaceholderSenderLabel(sender.name)
  ) {
    const reparsed = parseFrom(fromHeader);
    sender = {
      ...sender,
      name: resolveSenderDisplayName(reparsed.name, reparsed.email || sender.email || ""),
    };
  }

  let kundenId = bundle.liste.kundenAkteId ?? null;

  if (!kundenId && sender.email) {
    try {
      const response = await fetch("/api/vorgaenge/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromEmail: sender.email,
          fromName: sender.name,
          subject: bundle.liste.titel,
          body: bodyText,
          isSpam: bundle.liste.intent === "spam_newsletter",
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          intelligence?: { kundeId?: string | null; objektId?: string | null };
        };
        kundenId = payload.intelligence?.kundeId ?? kundenId;
      }
    } catch {
      // Lookup optional — Vorgang wird trotzdem gespeichert
    }
  }

  await createVorgangClient({
    source,
    titel: bundle.liste.titel,
    inhalt: bodyText || bundle.liste.titel,
    prioritaet: mapVorgangPriorityToCreate(bundle.liste.prioritaet),
    status: mapMailStatusToCreate(bundle.liste.status),
    kunden_id: kundenId,
    gmail_message_id: bundle.message.id,
    gmail_thread_id: bundle.message.threadId ?? null,
    absender_name: sender.name,
    absender_email: sender.email,
  });

  rememberPersistedMailMessageId(bundle.message.id);
}
