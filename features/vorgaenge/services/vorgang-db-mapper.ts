import {
  mapCreatePriorityToVorgang,
  mapCreateStatusToVorgang,
  VORGANG_SOURCE_LABELS,
  type VorgangDbRecord,
  type VorgangSource,
} from "@/features/vorgaenge/types/create-vorgang-types";
import { HELPY_PHONE_QUELLE } from "@/features/voice/services/helpy-phone-detector";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import { buildWorkspaceVorgangFromListe } from "@/features/workspace/services/workspace/workspace-engine";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

function formatReceivedLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-CH", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function resolveTyp(source: VorgangSource): ListeVorgang["typ"] {
  if (source === "helpy_phone") return "helpy_phone";
  return "normale_nachricht";
}

function resolveQuelle(source: VorgangSource): string {
  if (source === "helpy_phone") return HELPY_PHONE_QUELLE;
  return VORGANG_SOURCE_LABELS[source];
}

function resolveEmoji(source: VorgangSource): string {
  if (source === "helpy_phone") return "📞";
  if (source === "manuell") return "✏️";
  return "📋";
}

function resolveHelpyEmpfehlung(source: VorgangSource): string {
  switch (source) {
    case "helpy_phone":
      return "Telefon-Vorgang prüfen und nächsten Schritt einleiten.";
    case "manuell":
      return "Manuell erstellter Vorgang — bitte bearbeiten.";
    default:
      return "Vorgang prüfen und nächsten Schritt einleiten.";
  }
}

export function mapVorgangDbRecordToListeVorgang(
  record: VorgangDbRecord,
  options?: { kundeName?: string | null }
): ListeVorgang {
  const kunde =
    options?.kundeName?.trim() ||
    record.anrufer_nummer?.trim() ||
    "Unbekannt";

  return {
    id: record.id,
    typ: resolveTyp(record.source),
    titel: record.titel,
    emoji: resolveEmoji(record.source),
    kunde,
    quelle: resolveQuelle(record.source),
    prioritaet: mapCreatePriorityToVorgang(
      record.prioritaet as "kritisch" | "hoch" | "normal" | "niedrig"
    ),
    status: mapCreateStatusToVorgang(
      record.status as "neu" | "in_bearbeitung" | "warten_auf_antwort"
    ),
    summary: record.inhalt,
    helpyEmpfehlung: resolveHelpyEmpfehlung(record.source),
    helpyStatus: "Neu",
    receivedAt: record.created_at,
    receivedLabel: formatReceivedLabel(record.created_at),
    kundenAkteId: record.kunden_id ?? undefined,
    sourceEventId: record.gmail_message_id ?? undefined,
    threadId: record.gmail_thread_id ?? undefined,
    href: record.source === "helpy_phone" ? "/telefonie" : undefined,
  };
}

export function mapVorgangDbRecordToBundle(
  record: VorgangDbRecord,
  options?: { kundeName?: string | null }
): { liste: ListeVorgang; workspace: WorkspaceVorgang } {
  const liste = mapVorgangDbRecordToListeVorgang(record, options);
  const workspace = buildWorkspaceVorgangFromListe(liste);
  return {
    liste,
    workspace: {
      ...workspace,
      letzteEmail: {
        ...workspace.letzteEmail,
        inhalt: record.inhalt,
      },
      helpy: {
        ...workspace.helpy,
        intro:
          record.source === "helpy_phone"
            ? "Dieser Vorgang wurde aus einem Telefonanruf erstellt."
            : record.source === "manuell"
              ? "Manuell erstellter Vorgang."
              : workspace.helpy.intro,
      },
    },
  };
}
