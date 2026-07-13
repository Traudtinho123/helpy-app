import type {
  ReplyDraftInput,
  ReplyTemplateOutcome,
} from "@/features/reply-drafts/types/reply-draft-types";
import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { applyCompanyKnowledgeToReplyDraft } from "@/features/reply-drafts/services/reply-draft-company-knowledge";

function matchesIntent(input: ReplyDraftInput, keys: string[]): boolean {
  const haystack = [input.intent, input.intentLabel, input.brainResult?.intent]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return keys.some((key) => haystack.includes(key.toLowerCase()));
}

function replySubject(originalSubject: string): string {
  const trimmed = originalSubject.trim();
  if (!trimmed) return "Re: Ihre Nachricht";
  return trimmed.toLowerCase().startsWith("re:") ? trimmed : `Re: ${trimmed}`;
}

function greeting(name: string): string {
  return `Sehr geehrte/r ${name},`;
}

function closing(): string {
  return "Mit freundlichen Grüßen";
}

function formatSlotForReply(slot: AppointmentSlot, index: number): string {
  const shortDate = slot.dateLabel.replace(/^(\w+), /, (match, day) => {
    const abbr: Record<string, string> = {
      Montag: "Mo",
      Dienstag: "Di",
      Mittwoch: "Mi",
      Donnerstag: "Do",
      Freitag: "Fr",
      Samstag: "Sa",
      Sonntag: "So",
    };
    return `${abbr[day] ?? day} `;
  });
  return `📅 Option ${index + 1}: ${shortDate} · ${slot.start} Uhr`;
}

function buildViewingSlotsBlock(slots: AppointmentSlot[]): string {
  if (slots.length === 0) return "";
  return slots.map((slot, index) => formatSlotForReply(slot, index)).join("\n");
}

function realEstateBesichtigung(
  input: ReplyDraftInput,
  appointmentSlots: AppointmentSlot[] = []
): ReplyTemplateOutcome {
  const slotsBlock = buildViewingSlotsBlock(appointmentSlots);
  const objektName = input.subject?.trim() || "das Objekt";

  const body =
    appointmentSlots.length > 0
      ? `Guten Tag ${input.senderName},

vielen Dank für Ihr Interesse an ${objektName}.

Ich freue mich, Ihnen folgende Besichtigungstermine anbieten zu können:

${slotsBlock}

Bitte teilen Sie mir mit, welcher Termin für Sie passt, und ich sende Ihnen umgehend eine Kalendereinladung.`
      : `${greeting(input.senderName)}

vielen Dank für Ihre Nachricht und Ihr Interesse an einer Besichtigung.

Gerne schlage ich Ihnen einen Termin vor — bitte teilen Sie mir mit, wann es Ihnen in den nächsten Tagen am besten passt. Alternativ können wir auch telefonisch einen passenden Zeitpunkt abstimmen.

Auf Wunsch sende ich Ihnen vorab das Exposé zur Vorbereitung.

${closing()}`;

  return {
    tone: "Freundlich und professionell",
    subject: replySubject(input.subject),
    draftText: body,
    missingInfo:
      appointmentSlots.length > 0
        ? ["Bestätigung des Interessenten"]
        : [
            "Bevorzugter Besichtigungstermin",
            "Telefonnummer für Rückfragen",
            "Konkretes Objekt oder Referenz",
          ],
    suggestedAttachments: appointmentSlots.length > 0 ? [] : ["Exposé (Entwurf)"],
  };
}

function realEstateAnfrage(input: ReplyDraftInput): ReplyTemplateOutcome {
  return {
    tone: "Freundlich und einladend",
    subject: replySubject(input.subject),
    draftText: `${greeting(input.senderName)}

vielen Dank für Ihre Immobilienanfrage. Ich habe Ihr Anliegen zur Kenntnis genommen und prüfe passende Optionen für Sie.

Gerne schlage ich Ihnen eine Besichtigung vor oder melde mich telefonisch bei Ihnen, um Ihre Wünsche genauer zu besprechen. Was wäre Ihnen lieber?

${closing()}`,
    missingInfo: [
      "Gewünschte Lage oder Objektart",
      "Budgetrahmen",
      "Bevorzugter Kontaktweg (Besichtigung oder Rückruf)",
    ],
    suggestedAttachments: [],
  };
}

function constructionOfferte(input: ReplyDraftInput): ReplyTemplateOutcome {
  return {
    tone: "Klar und verbindlich",
    subject: replySubject(input.subject),
    draftText: `${greeting(input.senderName)}

vielen Dank für Ihre Offertanfrage. Für eine genaue Kalkulation schlage ich zuerst einen Vor-Ort-Termin vor, damit wir Umfang und Details gemeinsam aufnehmen können.

Die verbindliche Offerte erstelle ich nach der Besichtigung — so erhalten Sie eine realistische und nachvollziehbare Zusammenstellung.

Bitte nennen Sie mir zwei bis drei Terminvorschläge, die Ihnen passen würden.

${closing()}`,
    missingInfo: [
      "Adresse der Baustelle",
      "Gewünschter Zeitraum für den Vor-Ort-Termin",
      "Kurze Beschreibung der gewünschten Arbeiten",
    ],
    suggestedAttachments: ["Checkliste Vor-Ort-Termin"],
  };
}

function constructionBauprojekt(input: ReplyDraftInput): ReplyTemplateOutcome {
  return {
    tone: "Sachlich und kooperativ",
    subject: replySubject(input.subject),
    draftText: `${greeting(input.senderName)}

vielen Dank für Ihre Nachricht zu Ihrem Bauprojekt. Damit ich Ihnen gezielt weiterhelfen kann, benötige ich noch ein paar Angaben:

• Welchen Umfang hat das Projekt?
• An welcher Adresse soll gearbeitet werden?
• Wann wäre ein erster Termin vor Ort für Sie möglich?

Sobald ich diese Informationen habe, bereite ich die nächsten Schritte für Sie vor.

${closing()}`,
    missingInfo: [
      "Projektumfang",
      "Adresse der Baustelle",
      "Wunschtermin für Erstbesichtigung",
    ],
    suggestedAttachments: [],
  };
}

function consultingMandat(input: ReplyDraftInput): ReplyTemplateOutcome {
  return {
    tone: "Professionell und vertrauensvoll",
    subject: replySubject(input.subject),
    draftText: `${greeting(input.senderName)}

vielen Dank für Ihre Anfrage und Ihr Vertrauen. Gerne vereinbaren wir ein unverbindliches Erstgespräch, um Ihr Anliegen im Detail zu besprechen.

Bitte senden Sie mir — falls vorhanden — relevante Unterlagen oder Dokumente vorab zu. So können wir das Gespräch effizient nutzen.

Welche Termine würden Ihnen in den nächsten Tagen passen?

${closing()}`,
    missingInfo: [
      "Kurze Schilderung des Anliegens",
      "Relevante Unterlagen oder Verträge",
      "Bevorzugter Termin für Erstgespräch",
    ],
    suggestedAttachments: ["Mandatsmappe (Entwurf)"],
  };
}

function consultingFrist(input: ReplyDraftInput): ReplyTemplateOutcome {
  return {
    tone: "Sachlich und zuverlässig",
    subject: replySubject(input.subject),
    draftText: `${greeting(input.senderName)}

vielen Dank für Ihre Nachricht. Ich habe den Hinweis zur Frist zur Kenntnis genommen und werde den Vorgang umgehend prüfen.

Ich melde mich zeitnah mit einer Rückmeldung und den nächsten Schritten, sobald die Prüfung abgeschlossen ist.

${closing()}`,
    missingInfo: [
      "Konkretes Fristdatum",
      "Betroffene Aktenzeichen oder Referenzen",
      "Ergänzende Unterlagen",
    ],
    suggestedAttachments: ["Fristenübersicht (Entwurf)"],
  };
}

function defaultReply(input: ReplyDraftInput): ReplyTemplateOutcome {
  const summaryHint = input.brainResult?.summary ?? input.snippet;

  return {
    tone: "Freundlich und professionell",
    subject: replySubject(input.subject),
    draftText: `${greeting(input.senderName)}

vielen Dank für Ihre Nachricht${summaryHint ? `. ${summaryHint}` : ""}.

Ich habe Ihr Anliegen zur Kenntnis genommen und bereite die nächsten Schritte vor. Bei Rückfragen stehe ich Ihnen gerne zur Verfügung.

${closing()}`,
    missingInfo: ["Bevorzugter Rückkanal (E-Mail oder Telefon)"],
    suggestedAttachments: [],
  };
}

export function evaluateReplyTemplateRules(
  input: ReplyDraftInput,
  appointmentSlots: AppointmentSlot[] = []
): ReplyTemplateOutcome {
  const skill = input.skill ?? "real-estate";

  let outcome: ReplyTemplateOutcome;

  if (skill === "real-estate") {
    if (matchesIntent(input, ["besichtigung", "terminwunsch"])) {
      outcome = realEstateBesichtigung(input, appointmentSlots);
    } else if (matchesIntent(input, ["immobilien", "neue anfrage"])) {
      outcome = realEstateAnfrage(input);
    } else {
      outcome = realEstateAnfrage(input);
    }
  } else if (skill === "construction") {
    if (matchesIntent(input, ["offert", "angebot", "kostenvoranschlag"])) {
      outcome = constructionOfferte(input);
    } else if (
      matchesIntent(input, ["bauprojekt", "sanierung", "umbau", "renovation"])
    ) {
      outcome = constructionBauprojekt(input);
    } else {
      outcome = constructionOfferte(input);
    }
  } else if (skill === "consulting-legal") {
    if (matchesIntent(input, ["frist"])) {
      outcome = consultingFrist(input);
    } else if (
      matchesIntent(input, ["mandat", "neue anfrage", "dokument", "beratung"])
    ) {
      outcome = consultingMandat(input);
    } else {
      outcome = consultingMandat(input);
    }
  } else {
    outcome = defaultReply(input);
  }

  return applyCompanyKnowledgeToReplyDraft(outcome, {
    senderName: input.senderName,
  });
}
