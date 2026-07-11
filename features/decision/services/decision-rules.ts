import type {
  DecisionContext,
  DecisionRuleOutcome,
} from "@/features/decision/types/decision-types";
import { VORGANG_PRIORITY_LABELS } from "@/features/workspace/services/vorgaenge/types";

function matchesIntent(context: DecisionContext, keys: string[]): boolean {
  const haystack = [
    context.intent,
    context.intentLabel,
    context.brainResult?.intent,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return keys.some((key) => haystack.includes(key.toLowerCase()));
}

function withMemoryHint(context: DecisionContext, base: string): string {
  const parts = [base];
  if (context.companyKnowledgeHint) {
    parts.push(context.companyKnowledgeHint);
  }
  const hint = context.memoryEntries?.[0]?.insight;
  if (hint) parts.push(hint);
  return parts.join(" ");
}

function realEstateOutcome(context: DecisionContext): DecisionRuleOutcome {
  const isBesichtigung = matchesIntent(context, [
    "besichtigung",
    "terminwunsch",
  ]);
  const isImmobilienAnfrage = matchesIntent(context, [
    "immobilien",
    "neue anfrage",
    "immoscout",
  ]);

  if (isBesichtigung || isImmobilienAnfrage) {
    return {
      decisionTitle: isBesichtigung
        ? "Besichtigung priorisieren"
        : "Immobilienanfrage bearbeiten",
      reason: withMemoryHint(
        context,
        isBesichtigung
          ? `${context.kunde} möchte eine Besichtigung — Priorität ${VORGANG_PRIORITY_LABELS[context.priority]} und vollständige Kontaktangaben sprechen für einen schnellen Terminvorschlag.`
          : `${context.kunde} fragt nach einer Immobilie an. Objekt und Interessent sollten zuerst geprüft werden, bevor du antwortest.`
      ),
      nextBestStep: isBesichtigung
        ? "Besichtigungstermin vorschlagen und Einladung vorbereiten"
        : "Interessent prüfen und passendes Objekt zuordnen",
      preparedItems: [
        "Interessent vorbereiten",
        "Objekt prüfen",
        "Besichtigung vorschlagen",
        "Antwort vorbereiten",
        "Nachfass-Aufgabe vorbereiten",
      ],
      confirmationItems: [
        "Kontaktdaten und Objektangaben prüfen",
        "Terminvorschlag bestätigen",
        "Antwortentwurf freigeben",
      ],
      helpyMessage:
        "Ich habe den nächsten Schritt vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.",
    };
  }

  return defaultOutcome(context, "Immobilienvorgang strukturieren");
}

function constructionOutcome(context: DecisionContext): DecisionRuleOutcome {
  const isOfferte = matchesIntent(context, [
    "offert",
    "angebot",
    "kostenvoranschlag",
  ]);
  const isBauprojekt = matchesIntent(context, [
    "bauprojekt",
    "sanierung",
    "umbau",
    "renovation",
  ]);

  if (isOfferte || isBauprojekt) {
    return {
      decisionTitle: isOfferte
        ? "Offertanfrage bearbeiten"
        : "Bauprojekt vorbereiten",
      reason: withMemoryHint(
        context,
        isOfferte
          ? `${context.kunde} bittet um eine Offerte — zuerst Baustelle und Vor-Ort-Termin klären, danach Kalkulation und Material.`
          : `${context.kunde} plant ein Bauprojekt — Baustelle und Termin sollten vor der Offerte geklärt werden.`
      ),
      nextBestStep: isOfferte
        ? "Vor-Ort-Termin vorschlagen und Offerte skizzieren"
        : "Baustelle vorbereiten und Erstbesichtigung planen",
      preparedItems: [
        "Kunde vorbereiten",
        "Baustelle vorbereiten",
        "Vor-Ort-Termin vorschlagen",
        "Offerte vorbereiten",
        "Materialliste vorbereiten",
      ],
      confirmationItems: [
        "Baustellenangaben prüfen",
        "Terminvorschlag bestätigen",
        "Offertenentwurf freigeben",
      ],
      helpyMessage:
        "Ich habe den nächsten Schritt vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.",
    };
  }

  return defaultOutcome(context, "Handwerksvorgang strukturieren");
}

function consultingOutcome(context: DecisionContext): DecisionRuleOutcome {
  const isMandat = matchesIntent(context, ["mandat", "neue anfrage"]);
  const isFrist = matchesIntent(context, ["frist"]);
  const isDokument = matchesIntent(context, ["dokument", "unterlage", "anhang"]);

  if (isMandat || isFrist || isDokument) {
    const focus = isFrist
      ? "Frist sichern"
      : isDokument
        ? "Dokument prüfen"
        : "Mandatsanfrage bearbeiten";

    return {
      decisionTitle: focus,
      reason: withMemoryHint(
        context,
        isFrist
          ? `Eine Frist ist erkennbar — ${context.kunde} und Unterlagen sollten zuerst gesichert werden.`
          : isDokument
            ? `${context.kunde} hat ein Dokument geschickt — Inhalt und nächste Schritte sollten geprüft werden.`
            : `${context.kunde} interessiert sich für ein Mandat — Erstgespräch und Unterlagen vorbereiten.`
      ),
      nextBestStep: isFrist
        ? "Frist im Kalender sichern und Erinnerung vorbereiten"
        : isDokument
          ? "Dokument prüfen und Rückmeldung vorbereiten"
          : "Erstgespräch vorschlagen und Mandatsmappe vorbereiten",
      preparedItems: [
        "Mandant/Kunde vorbereiten",
        "Frist prüfen",
        "Erstgespräch vorschlagen",
        "Dokument prüfen",
        "Antwort vorbereiten",
      ],
      confirmationItems: [
        "Frist und Mandantendaten prüfen",
        "Terminvorschlag bestätigen",
        "Antwortentwurf freigeben",
      ],
      helpyMessage:
        "Ich habe den nächsten Schritt vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.",
    };
  }

  return defaultOutcome(context, "Beratungsvorgang strukturieren");
}

function defaultOutcome(
  context: DecisionContext,
  title: string
): DecisionRuleOutcome {
  return {
    decisionTitle: title,
    reason: withMemoryHint(
      context,
      `${context.kunde} hat eine neue Nachricht — ich habe die wichtigsten Punkte zusammengefasst und einen sinnvollen nächsten Schritt vorbereitet.`
    ),
    nextBestStep:
      context.recommendedAction ??
      context.brainResult?.recommendedAction ??
      "Antwort vorbereiten und nächsten Kontakt planen",
    preparedItems: [
      "Kontext prüfen",
      "Antwort vorbereiten",
      "Nächste Aufgabe vorbereiten",
    ],
    confirmationItems: [
      "Angaben prüfen",
      "Nächsten Schritt bestätigen",
    ],
    helpyMessage:
      "Ich habe den nächsten Schritt vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.",
  };
}

export function evaluateDecisionRules(
  context: DecisionContext
): DecisionRuleOutcome {
  switch (context.skill) {
    case "real-estate":
      return realEstateOutcome(context);
    case "construction":
      return constructionOutcome(context);
    case "consulting-legal":
      return consultingOutcome(context);
    default:
      return defaultOutcome(context, "Vorgang bearbeiten");
  }
}
