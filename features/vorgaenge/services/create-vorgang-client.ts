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

  await createVorgangClient({
    source,
    titel: bundle.liste.titel,
    inhalt:
      bundle.liste.summary?.trim() ||
      bundle.liste.snippet?.trim() ||
      bundle.message.snippet?.trim() ||
      bundle.liste.titel,
    prioritaet: mapVorgangPriorityToCreate(bundle.liste.prioritaet),
    status: mapMailStatusToCreate(bundle.liste.status),
    kunden_id: bundle.liste.kundenAkteId ?? null,
    gmail_message_id: bundle.message.id,
    gmail_thread_id: bundle.message.threadId ?? null,
  });
}
