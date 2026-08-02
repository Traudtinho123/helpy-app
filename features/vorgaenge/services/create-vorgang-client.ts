import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import {
  resolveVorgangSenderFromText,
} from "@/features/workspace/services/vorgaenge/resolve-vorgang-sender";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import {
  ingestDbVorgangBundle,
} from "@/features/vorgaenge/services/db-vorgaenge-store";
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

  return {
    ok: true,
    id: payload.id,
    created: payload.created ?? true,
    liste: payload.liste,
    workspace: payload.workspace,
  };
}

function mapMailStatusToCreate(status: ListeVorgang["status"]): CreateVorgangStatus {
  if (status === "in_bearbeitung") return "in_bearbeitung";
  if (status === "wartend") return "warten_auf_antwort";
  return "neu";
}

export async function persistMailBundleToDb(
  bundle: GmailVorgangBundle
): Promise<void> {
  const source = resolveMailSourceFromQuelle(bundle.liste.quelle);
  const fromHeader =
    bundle.liste.from?.trim() ||
    bundle.message.from?.trim() ||
    bundle.liste.kunde;
  const bodyText =
    bundle.liste.summary?.trim() ||
    bundle.liste.snippet?.trim() ||
    bundle.message.snippet?.trim() ||
    "";

  const sender = resolveVorgangSenderFromText({
    fromHeader,
    bodyText,
    subject: bundle.liste.titel,
    fallbackName: bundle.liste.kunde,
  });

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
}
