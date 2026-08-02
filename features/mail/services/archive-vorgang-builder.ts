import type { BrainV3Result } from "@/features/brain/types/brain-v3-types";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import { formatGmailDateTime } from "@/features/gmail/services/gmail-date-format";
import { parseFrom, resolveSenderDisplayName } from "@/features/gmail/services/parse-from-header";
import { normalizeMailTimestampToIso } from "@/features/mail/services/mail-received-at";
import {
  mapMailCategoryToArchiveCategory,
  type VorgangArchiveCategory,
  type VorgangMailCategory,
} from "@/features/mail/services/vorgang-classification-types";
import { mapUnifiedMailToGmailConnector } from "@/features/mail/services/unified-mail-mapper";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { DEFAULT_HELPY_SKILL } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

const ARCHIVE_CATEGORY_LABELS: Record<VorgangArchiveCategory, string> = {
  newsletter: "Newsletter",
  werbung: "Werbung",
  system: "System",
  spam: "Spam",
};

function buildArchiveBrainStub(
  message: GmailConnectorMessage,
  reason: string
): BrainV3Result {
  return {
    id: message.id,
    source: "gmail",
    originalEmailId: message.id,
    threadId: message.threadId,
    subject: message.subject,
    from: message.from,
    skill: "Allgemein",
    intent: "Spam / Newsletter",
    priority: "niedrig",
    summary: reason,
    recommendedAction: "Archivieren — keine Antwort nötig.",
    status: "Von HELPY vorbereitet",
    createdAt: message.date,
  };
}

function buildArchiveWorkspace(liste: Vorgang): WorkspaceVorgang {
  return {
    id: liste.id,
    skill: DEFAULT_HELPY_SKILL,
    aufgabe: {
      titel: liste.titel,
      kategorie: ARCHIVE_CATEGORY_LABELS[liste.archiveCategory ?? "spam"],
      deadline: liste.receivedLabel,
      fortschritt: 0,
      empfohleneAktion: "Keine Aktion nötig",
    },
    kunde: {
      firmenname: liste.kunde,
      ansprechpartner: liste.kunde,
      email: liste.absenderEmail ?? "",
      telefon: "",
      adresse: "",
      status: "Archiviert",
    },
    letzteEmail: {
      betreff: liste.titel,
      absender: liste.from ?? liste.kunde,
      datum: liste.receivedLabel,
      inhalt: liste.snippet ?? liste.summary ?? "",
      zusammenfassung: liste.summary ?? "",
    },
    termine: [],
    dokumente: [],
    notizen: liste.helpyEmpfehlung,
    helpy: {
      empfehlung: liste.helpyEmpfehlung,
      naechsterSchritt: "Keine Aktion nötig",
      erkannt: "Automatisch aussortiert",
    },
    kopfzeile: {
      statusLabel: "Archiviert",
      prioritaetLabel: "Niedrig",
      quelle: liste.quelle,
      intentLabel: liste.intentLabel,
    },
  };
}

export function buildArchiveVorgangBundle(input: {
  message: UnifiedMailMessage;
  reason: string;
  mailCategory?: VorgangMailCategory;
  archiveCategory?: VorgangArchiveCategory;
}): GmailVorgangBundle {
  const connector = mapUnifiedMailToGmailConnector(input.message);
  const parsed = parseFrom(connector.from);
  const senderEmail = parsed.email ?? input.message.from;
  const senderName = resolveSenderDisplayName(parsed.name, senderEmail);
  const archiveCategory =
    input.archiveCategory ??
    (input.mailCategory
      ? mapMailCategoryToArchiveCategory(input.mailCategory)
      : "spam");
  const receivedAt =
    normalizeMailTimestampToIso(connector.date) ?? new Date().toISOString();

  const liste: Vorgang = {
    id: `archive-${input.message.provider}-${input.message.providerMessageId}`,
    typ: "normale_nachricht",
    intent: "spam_newsletter",
    intentLabel: ARCHIVE_CATEGORY_LABELS[archiveCategory],
    titel: connector.subject || "(Kein Betreff)",
    emoji: "🗄️",
    kunde: senderName || senderEmail || "Unbekannt",
    quelle: input.message.provider === "outlook" ? "Outlook" : "Gmail",
    prioritaet: "niedrig",
    status: "zu_archivieren",
    archiveCategory,
    summary: input.reason,
    helpyEmpfehlung: input.reason,
    receivedAt,
    receivedLabel: formatGmailDateTime(connector.date),
    from: connector.from,
    absenderEmail: senderEmail || undefined,
    snippet: connector.snippet,
    sourceEventId: connector.id,
    threadId: connector.threadId,
    mailProvider: input.message.provider,
    mailConnectionId: input.message.connectionId,
    latestMessageDirection: connector.direction ?? "incoming",
  };

  const workspace = buildArchiveWorkspace(liste);

  return {
    liste,
    workspace,
    message: connector,
    brain: buildArchiveBrainStub(connector, input.reason),
  };
}
