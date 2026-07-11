import type { BrainV3Intent, BrainV3Result, BrainV3Skill } from "@/features/brain/types/brain-v3-types";
import {
  buildPlatformInquiryContextLines,
} from "@/features/brain/services/platform-inquiry-extractor";
import {
  getPlatformSourceLabel,
} from "@/features/brain/services/platform-email-detector";
import { buildViewingContextLines } from "@/features/brain/services/viewing-extraction";
import {
  PLATFORM_INQUIRY_MISSING,
  PLATFORM_INQUIRY_PANEL_INTRO,
  PLATFORM_INQUIRY_RECOMMENDATION,
} from "@/features/brain/types/platform-inquiry-types";
import { formatGmailDateTime, formatGmailTime } from "@/features/gmail/services/gmail-date-format";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import { normalizeMailTimestampToIso } from "@/features/mail/services/mail-received-at";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import {
  HELPY_ARCHIVE_PANEL_INTRO,
  HELPY_ARCHIVE_RECOMMENDATION,
  HELPY_ARCHIVE_STATUS_PREPARED,
  HELPY_WORKSPACE_INTRO,
} from "@/features/review/services/safety/review-mode";
import type {
  Vorgang,
  VorgangTyp,
} from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type {
  Vorgang as WorkspaceVorgang,
  VorgangHelpy,
  VorgangKopfzeile,
  VorgangKunde,
} from "@/features/workspace/services/workspace/types";

const INTENT_TO_VORGANG_TYP: Record<BrainV3Intent, VorgangTyp> = {
  "Neue Anfrage": "neuer_kunde",
  Interessentenanfrage: "anfrage",
  Angebotsanfrage: "angebotsanfrage",
  Besichtigung: "anfrage",
  "Vor-Ort-Termin": "terminwunsch",
  Materialanfrage: "anfrage",
  Auftragsanfrage: "anfrage",
  Mandatsanfrage: "anfrage",
  Erstgespräch: "terminwunsch",
  Geschäftsanfrage: "geschaeftsanfrage",
  "Bestandskunden-Kommunikation": "bestandskunde",
  Rückruf: "rueckruf",
  Terminwunsch: "terminwunsch",
  Frist: "frist",
  Rechnung: "rechnung",
  Dokument: "normale_nachricht",
  "Normale Nachricht": "normale_nachricht",
  "Sonstiges / Unklar": "normale_nachricht",
  "Spam / Newsletter": "normale_nachricht",
};

const INTENT_TO_INTERNAL: Record<BrainV3Intent, string> = {
  "Neue Anfrage": "normale_nachricht",
  Interessentenanfrage: "interessentenanfrage",
  Angebotsanfrage: "angebotsanfrage",
  Besichtigung: "besichtigung",
  "Vor-Ort-Termin": "vor_ort_termin",
  Materialanfrage: "materialanfrage",
  Auftragsanfrage: "auftragsanfrage",
  Mandatsanfrage: "mandatsanfrage",
  Erstgespräch: "erstgespraech",
  Geschäftsanfrage: "geschaeftsanfrage",
  "Bestandskunden-Kommunikation": "bestandskunde",
  Rückruf: "rueckruf",
  Terminwunsch: "terminwunsch",
  Frist: "frist",
  Rechnung: "rechnung",
  Dokument: "dokument",
  "Normale Nachricht": "normale_nachricht",
  "Sonstiges / Unklar": "unklar",
  "Spam / Newsletter": "spam_newsletter",
};

const INTENT_EMOJI: Record<BrainV3Intent, string> = {
  "Neue Anfrage": "📩",
  Interessentenanfrage: "🏠",
  Angebotsanfrage: "📄",
  Besichtigung: "🏡",
  "Vor-Ort-Termin": "🔧",
  Materialanfrage: "📦",
  Auftragsanfrage: "🏗",
  Mandatsanfrage: "⚖",
  Erstgespräch: "🗣",
  Geschäftsanfrage: "🤝",
  "Bestandskunden-Kommunikation": "🔁",
  Rückruf: "☎",
  Terminwunsch: "📅",
  Frist: "⏰",
  Rechnung: "🧾",
  Dokument: "📎",
  "Normale Nachricht": "✉",
  "Sonstiges / Unklar": "❔",
  "Spam / Newsletter": "📰",
};

const HELPY_STATUS_LABEL = "Von HELPY vorbereitet";

function isSpamResult(result: BrainV3Result): boolean {
  return result.intent === "Spam / Newsletter";
}

export function extractSenderName(from: string): string {
  const withoutEmail = from.split("<")[0]?.trim() ?? from;
  return withoutEmail.replace(/^["']|["']$/g, "").trim() || from;
}

function skillToInternal(skill: BrainV3Skill): HelpySkill | undefined {
  switch (skill) {
    case "HELPY Real Estate":
      return "real-estate";
    case "HELPY Construction":
      return "construction";
    case "HELPY Consulting & Legal":
      return "consulting-legal";
    default:
      return undefined;
  }
}

function isPlatformInquiryResult(result: BrainV3Result): boolean {
  return Boolean(result.detectedPlatform && result.platformInquiry);
}

function resolveInteressentName(result: BrainV3Result): string {
  const inquiry = result.platformInquiry;
  if (
    inquiry &&
    inquiry.interessentName !== PLATFORM_INQUIRY_MISSING
  ) {
    return inquiry.interessentName;
  }

  return extractSenderName(result.from);
}

function applyPlatformInquiryToListeVorgang(
  vorgang: Vorgang,
  result: BrainV3Result
): Vorgang {
  if (!isPlatformInquiryResult(result) || !result.platformInquiry) {
    return vorgang;
  }

  const quelle = getPlatformSourceLabel(result.detectedPlatform!);
  const inquiry = result.platformInquiry;

  const isViewing = result.intent === "Besichtigung";
  const viewingLines = result.viewingExtraction
    ? buildViewingContextLines(result.viewingExtraction)
    : [];
  const platformLines = buildPlatformInquiryContextLines(inquiry);
  const detectedContext = [
    ...platformLines,
    ...viewingLines.filter(
      (line) => !platformLines.some((existing) => existing.startsWith(line.split(":")[0] + ":"))
    ),
  ];

  return {
    ...vorgang,
    typ: "anfrage",
    intent: isViewing ? "besichtigung" : "interessentenanfrage",
    intentLabel: isViewing ? "Besichtigung" : "Interessentenanfrage",
    titel: isViewing ? "Besichtigungstermin" : "Interessentenanfrage",
    emoji: isViewing ? "🏡" : "🏠",
    kunde: resolveInteressentName(result),
    quelle,
    prioritaet: "hoch",
    summary: result.summary,
    detectedContext,
    recommendedNextStep: isViewing
      ? "Besichtigung vorschlagen"
      : "Interessent prüfen",
    helpyEmpfehlung: PLATFORM_INQUIRY_RECOMMENDATION,
    helpyMessage: inquiry.nachricht,
    preparedActions: isViewing
      ? ["Antwort vorbereiten", "Besichtigungstermin vorschlagen"]
      : ["Interessent prüfen", "Besichtigung vorbereiten"],
  };
}

function applyViewingExtractionToListeVorgang(
  vorgang: Vorgang,
  result: BrainV3Result
): Vorgang {
  if (result.intent !== "Besichtigung" || !result.viewingExtraction) {
    return vorgang;
  }

  if (isPlatformInquiryResult(result)) {
    return vorgang;
  }

  const lines = buildViewingContextLines(result.viewingExtraction);
  return {
    ...vorgang,
    titel: result.viewingExtraction.objectHint
      ? `Besichtigung: ${result.viewingExtraction.objectHint}`
      : "Besichtigungstermin",
    kunde: result.viewingExtraction.contactName || vorgang.kunde,
    detectedContext: lines.length > 0 ? lines : vorgang.detectedContext,
    preparedActions: [
      "Antwort vorbereiten",
      "Besichtigungstermin vorschlagen",
    ],
  };
}

/** Mappt ein Brain-v3-Ergebnis auf ein Vorgangs-Listenobjekt. */
export function mapBrainResultToVorgang(
  result: BrainV3Result,
  message?: Pick<GmailConnectorMessage, "snippet" | "date">
): Vorgang {
  const snippet = message?.snippet ?? "";
  const rawMailDate = message?.date ?? result.createdAt;
  const mailReceivedAt =
    normalizeMailTimestampToIso(rawMailDate) ??
    normalizeMailTimestampToIso(result.createdAt) ??
    result.createdAt;

  const base: Vorgang = {
    id: result.id,
    typ: INTENT_TO_VORGANG_TYP[result.intent],
    intent: INTENT_TO_INTERNAL[result.intent],
    intentLabel: result.intent,
    titel: result.subject || "(Kein Betreff)",
    emoji: INTENT_EMOJI[result.intent],
    kunde: extractSenderName(result.from),
    quelle: "Gmail",
    prioritaet: result.priority,
    status: "neu",
    summary: result.summary,
    recommendedNextStep: isSpamResult(result)
      ? HELPY_ARCHIVE_RECOMMENDATION
      : result.recommendedAction,
    helpyEmpfehlung: isSpamResult(result)
      ? HELPY_ARCHIVE_RECOMMENDATION
      : result.recommendedAction,
    helpyMessage: result.summary,
    receivedAt: mailReceivedAt,
    receivedLabel: formatGmailDateTime(rawMailDate),
    sourceEventId: result.originalEmailId,
    threadId: result.threadId,
    snippet,
    skill: skillToInternal(result.skill),
    skillLabel: result.skill,
    helpyStatus: isSpamResult(result)
      ? HELPY_ARCHIVE_STATUS_PREPARED
      : HELPY_STATUS_LABEL,
    from: result.from,
    emailDate: rawMailDate,
    href: `/workspace/${result.id}`,
  };

  return applyViewingExtractionToListeVorgang(
    applyPlatformInquiryToListeVorgang(base, result),
    result
  );
}

export function mapBrainResultsToVorgaenge(
  results: BrainV3Result[],
  messages: GmailConnectorMessage[]
): Vorgang[] {
  const byId = new Map(messages.map((message) => [message.id, message]));

  return results.map((result) =>
    mapBrainResultToVorgang(result, byId.get(result.originalEmailId))
  );
}

function buildKunde(result: BrainV3Result): VorgangKunde {
  const inquiry = result.platformInquiry;
  const viewing = result.viewingExtraction;
  const name =
    viewing?.contactName ||
    resolveInteressentName(result);

  return {
    firmenname: name,
    ansprechpartner: name,
    email:
      (inquiry && inquiry.interessentEmail !== PLATFORM_INQUIRY_MISSING
        ? inquiry.interessentEmail
        : null) ??
      viewing?.contactEmail ??
      extractEmailAddress(result.from) ??
      "—",
    telefon:
      (inquiry && inquiry.telefon !== PLATFORM_INQUIRY_MISSING
        ? inquiry.telefon
        : null) ??
      viewing?.contactPhone ??
      "—",
    adresse:
      inquiry && inquiry.objektadresse !== PLATFORM_INQUIRY_MISSING
        ? inquiry.objektadresse
        : viewing?.objectHint ?? "—",
    status: "Neu",
  };
}

function buildHelpy(result: BrainV3Result): VorgangHelpy {
  if (isSpamResult(result)) {
    return {
      intro: HELPY_ARCHIVE_PANEL_INTRO,
      erkannt: result.summary,
      empfehlung: HELPY_ARCHIVE_RECOMMENDATION,
      naechsterSchritt: HELPY_ARCHIVE_STATUS_PREPARED,
    };
  }

  if (isPlatformInquiryResult(result)) {
    return {
      intro: PLATFORM_INQUIRY_PANEL_INTRO,
      erkannt: result.summary,
      empfehlung: PLATFORM_INQUIRY_RECOMMENDATION,
      naechsterSchritt: "Interessent prüfen",
    };
  }

  return {
    intro: HELPY_WORKSPACE_INTRO,
    erkannt: result.summary,
    empfehlung: result.recommendedAction,
    naechsterSchritt: result.recommendedAction,
  };
}

function buildKopfzeile(result: BrainV3Result): VorgangKopfzeile {
  const quelle = isPlatformInquiryResult(result)
    ? getPlatformSourceLabel(result.detectedPlatform!)
    : "Gmail";

  return {
    statusLabel: isSpamResult(result)
      ? HELPY_ARCHIVE_STATUS_PREPARED
      : HELPY_STATUS_LABEL,
    prioritaetLabel:
      result.priority.charAt(0).toUpperCase() + result.priority.slice(1),
    quelle,
    intentLabel:
      isPlatformInquiryResult(result) && result.intent === "Besichtigung"
        ? "Besichtigung"
        : isPlatformInquiryResult(result)
          ? "Immobilienanfrage"
          : result.intent,
  };
}

/** Workspace-Daten aus Gmail + Brain-v3 für /workspace/[id]. */
export function mapBrainResultToWorkspaceVorgang(
  result: BrainV3Result,
  message: GmailConnectorMessage
): WorkspaceVorgang {
  const kunde = buildKunde(result);
  const internalSkill = skillToInternal(result.skill) ?? "real-estate";
  const inquiry = result.platformInquiry;
  const viewing = result.viewingExtraction;
  const besichtigungTermin =
    (inquiry && inquiry.besichtigungstermin !== PLATFORM_INQUIRY_MISSING
      ? inquiry.besichtigungstermin
      : null) ??
    (viewing?.preferredDateLabel
      ? `${viewing.preferredDateLabel}${
          viewing.preferredTimeWindow
            ? ` · ${viewing.preferredTimeWindow}`
            : ""
        }`
      : viewing?.preferredTimeWindow ?? null);

  const isViewing = result.intent === "Besichtigung";

  return {
    id: result.id,
    skill: internalSkill,
    kunde,
    aufgabe: {
      titel: isPlatformInquiryResult(result)
        ? isViewing
          ? "Besichtigungstermin"
          : "Neue Immobilienanfrage"
        : isViewing
          ? viewing?.objectHint
            ? `Besichtigung: ${viewing.objectHint}`
            : "Besichtigungstermin"
          : result.subject || "(Kein Betreff)",
      kategorie: isPlatformInquiryResult(result)
        ? isViewing
          ? "Besichtigung"
          : "Immobilienanfrage"
        : result.intent,
      deadline: formatGmailTime(message.date),
      fortschritt: 35,
      empfohleneAktion: isPlatformInquiryResult(result)
        ? PLATFORM_INQUIRY_RECOMMENDATION
        : result.recommendedAction,
    },
    letzteEmail: {
      betreff: message.subject,
      absender: result.from,
      datum: formatGmailDateTime(message.date),
      inhalt: message.snippet,
      zusammenfassung: result.summary,
    },
    termine: besichtigungTermin
      ? [
          {
            titel: "Besichtigungswunsch",
            datum: besichtigungTermin,
            ort:
              (inquiry &&
              inquiry.objektadresse !== PLATFORM_INQUIRY_MISSING
                ? inquiry.objektadresse
                : null) ??
              viewing?.objectHint ??
              "—",
          },
        ]
      : [],
    dokumente: [],
    notizen: isPlatformInquiryResult(result)
      ? `${getPlatformSourceLabel(result.detectedPlatform!)} · Thread ${result.threadId}`
      : `Gmail · Thread ${result.threadId}`,
    helpy: buildHelpy(result),
    kopfzeile: buildKopfzeile(result),
  };
}

export type GmailVorgangBundle = {
  liste: Vorgang;
  workspace: WorkspaceVorgang;
  message: GmailConnectorMessage;
  brain: BrainV3Result;
};

export function buildGmailVorgangBundle(
  result: BrainV3Result,
  message: GmailConnectorMessage
): GmailVorgangBundle {
  const liste = mapBrainResultToVorgang(result, message);
  const workspace = {
    ...mapBrainResultToWorkspaceVorgang(result, message),
    id: liste.id,
  };

  return {
    liste,
    workspace,
    message,
    brain: result,
  };
}

export function buildGmailVorgangBundles(
  results: BrainV3Result[],
  messages: GmailConnectorMessage[]
): GmailVorgangBundle[] {
  const byId = new Map(messages.map((message) => [message.id, message]));

  return results
    .map((result) => {
      const message = byId.get(result.originalEmailId);
      if (!message) return null;
      return buildGmailVorgangBundle(result, message);
    })
    .filter((bundle): bundle is GmailVorgangBundle => bundle !== null);
}
