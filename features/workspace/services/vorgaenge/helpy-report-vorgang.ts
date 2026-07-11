import type { BrainV3Result } from "@/features/brain/types/brain-v3-types";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import { formatGmailDateTime } from "@/features/gmail/services/gmail-date-format";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import {
  mapGmailMessageToUnifiedMail,
  mapUnifiedMailToGmailConnector,
} from "@/features/mail/services/unified-mail-mapper";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import {
  resolveHelpyReportLabel,
  stripHelpySubjectPrefix,
} from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import type {
  Vorgang as WorkspaceVorgang,
  VorgangHelpy,
  VorgangKopfzeile,
} from "@/features/workspace/services/workspace/types";

function buildHelpyReportBrainStub(
  message: UnifiedMailMessage,
  vorgangId: string
): BrainV3Result {
  return {
    id: vorgangId,
    source: message.provider === "outlook" ? "outlook" : "gmail",
    originalEmailId: message.providerMessageId,
    threadId: message.providerThreadId,
    subject: message.subject,
    from: message.from,
    skill: "HELPY Real Estate",
    intent: "Normale Nachricht",
    priority: "niedrig",
    summary: message.snippet,
    recommendedAction: "",
    status: "Von HELPY vorbereitet",
    createdAt: message.receivedAt,
  };
}

function buildHelpyReportWorkspace(
  message: UnifiedMailMessage,
  vorgangId: string,
  intentLabel: string
): WorkspaceVorgang {
  const helpy: VorgangHelpy = {
    intro: "System-Mitteilung von HELPY — nur zur Information, keine Aktion nötig.",
    erkannt: message.snippet || stripHelpySubjectPrefix(message.subject),
    empfehlung: "",
    naechsterSchritt: "",
  };

  const kopfzeile: VorgangKopfzeile = {
    statusLabel: "Report",
    prioritaetLabel: "",
    quelle: "HELPY",
    intentLabel,
  };

  return {
    id: vorgangId,
    skill: "real-estate",
    kunde: {
      firmenname: "HELPY",
      ansprechpartner: "HELPY",
      email: "—",
      telefon: "—",
      adresse: "—",
      status: "System",
    },
    aufgabe: {
      titel: stripHelpySubjectPrefix(message.subject) || "(Kein Betreff)",
      kategorie: intentLabel,
      deadline: formatGmailDateTime(message.receivedAt),
      fortschritt: 100,
      empfohleneAktion: "",
    },
    letzteEmail: {
      betreff: message.subject,
      absender: message.from,
      datum: formatGmailDateTime(message.receivedAt),
      inhalt: message.bodyPreview || message.snippet,
      zusammenfassung: message.snippet,
    },
    termine: [],
    dokumente: [],
    notizen: `HELPY Report · ${message.provider} · Thread ${message.providerThreadId}`,
    helpy,
    kopfzeile,
  };
}

export function buildHelpyReportBundle(
  message: UnifiedMailMessage
): GmailVorgangBundle {
  const connector = mapUnifiedMailToGmailConnector(message);
  const vorgangId = `helpy-report-${message.providerMessageId}`;
  const intentLabel = resolveHelpyReportLabel(message.subject);
  const titel = stripHelpySubjectPrefix(message.subject) || "(Kein Betreff)";

  const liste: Vorgang = {
    id: vorgangId,
    typ: "helpy_report",
    intent: "helpy_report",
    intentLabel,
    titel,
    emoji: "📊",
    kunde: "HELPY",
    quelle: "HELPY",
    prioritaet: "niedrig",
    status: "erledigt",
    summary: message.snippet,
    helpyEmpfehlung: "",
    receivedAt: message.receivedAt,
    receivedLabel: formatGmailDateTime(message.receivedAt),
    sourceEventId: message.providerMessageId,
    threadId: message.providerThreadId,
    snippet: message.snippet,
    from: message.from,
    emailDate: message.receivedAt,
    href: `/workspace/${vorgangId}`,
    mailProvider: message.provider,
    mailConnectionId: message.connectionId,
    mailAttachments: message.attachments.length ? message.attachments : undefined,
    latestMessageDirection: message.direction,
    latestMessageFrom: message.from,
    latestMessageAt: message.receivedAt,
    hasUnreadExternalMessage: false,
  };

  return {
    liste,
    workspace: buildHelpyReportWorkspace(message, vorgangId, intentLabel),
    message: connector as GmailConnectorMessage,
    brain: buildHelpyReportBrainStub(message, vorgangId),
  };
}

export function buildHelpyReportBundleFromGmailMessage(
  message: GmailConnectorMessage,
  sourceAccountEmail?: string | null,
  connectionId?: string
): GmailVorgangBundle {
  const unified = mapGmailMessageToUnifiedMail(
    message,
    sourceAccountEmail ?? null,
    connectionId
  );
  return buildHelpyReportBundle(unified);
}
