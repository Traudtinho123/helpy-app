import { getScenarioActions } from "@/features/brain/services/helpy-actions/action-catalog";
import type {
  AnalyzeActionsInput,
  HelpyAction,
  HelpyActionAnalysis,
  HelpyActionScenario,
} from "@/features/brain/services/helpy-actions/types";
import { sanitizeHelpyCopy } from "@/features/review/services/safety";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

function sanitizeAction(action: HelpyAction): HelpyAction {
  return {
    ...action,
    title: sanitizeHelpyCopy(action.title),
    description: sanitizeHelpyCopy(action.description),
    primaryLabel: sanitizeHelpyCopy(action.primaryLabel),
  };
}

function buildSearchText(vorgang: Vorgang): string {
  const { aufgabe, letzteEmail, kunde } = vorgang;

  return [
    aufgabe.titel,
    aufgabe.kategorie,
    aufgabe.empfohleneAktion,
    letzteEmail.betreff,
    letzteEmail.zusammenfassung,
    kunde.status,
    vorgang.helpy.naechsterSchritt,
  ]
    .join(" ")
    .toLowerCase();
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectScenario(skill: HelpySkill, vorgang: Vorgang): HelpyActionScenario {
  const text = buildSearchText(vorgang);
  const { kategorie } = vorgang.aufgabe;
  const { status: kundenStatus } = vorgang.kunde;

  if (skill === "real-estate") {
    if (
      includesAny(text, [
        "besichtigung",
        "besichtigen",
        "objekt",
        "immobilie",
        "expose",
        "exposé",
      ])
    ) {
      return "besichtigung";
    }

    if (
      includesAny(text, [
        "neuer kunde",
        "neukunde",
        "erstkontakt",
        "interessent",
        "lead",
        "linkedin",
      ]) ||
      kundenStatus.toLowerCase().includes("neu")
    ) {
      return "interessent";
    }

    return "allgemein";
  }

  if (skill === "construction") {
    if (
      includesAny(text, [
        "rückfrage",
        "rueckfrage",
        "nachfrage",
        "garantie",
        "wartung",
        "beantworten",
      ]) ||
      kategorie === "E-Mail"
    ) {
      return "rueckfrage";
    }

    if (
      includesAny(text, [
        "offertanfrage",
        "angebotsanfrage",
        "angebot",
        "offerte",
        "kalkulation",
      ]) ||
      kategorie === "Angebot"
    ) {
      if (vorgang.angebot?.status === "Entwurf" || vorgang.aufgabe.fortschritt >= 50) {
        return "angebot";
      }
      return "offertanfrage";
    }

    return "allgemein";
  }

  if (skill === "consulting-legal") {
    if (
      includesAny(text, [
        "frist",
        "einspruch",
        "behörde",
        "steuerbescheid",
        "elster",
        "deadline",
      ]) ||
      kategorie === "Behörde"
    ) {
      return "frist";
    }

    if (
      includesAny(text, ["termin", "gespräch", "besprechung", "meeting"]) ||
      kategorie === "Termin" ||
      vorgang.termine.length > 0
    ) {
      return "termin";
    }

    if (
      includesAny(text, ["angebot", "honorar", "vertrag", "freigabe"]) ||
      kategorie === "Angebot"
    ) {
      return "angebot";
    }

    if (
      includesAny(text, [
        "neuer kunde",
        "neukunde",
        "erstkontakt",
        "interessent",
        "anfrage",
        "lead",
      ]) ||
      vorgang.kunde.status.toLowerCase().includes("neu") ||
      vorgang.kunde.status.toLowerCase().includes("interessent")
    ) {
      return "neue-anfrage";
    }

    return "allgemein";
  }

  return "allgemein";
}

function personalizeAction(action: HelpyAction, vorgang: Vorgang): HelpyAction {
  const name = vorgang.kunde.ansprechpartner.split(" ")[0];
  const firma = vorgang.kunde.firmenname;

  return {
    ...action,
    description: action.description
      .replace("{name}", name)
      .replace("{firma}", firma),
  };
}

function buildAnalysisText(
  scenario: HelpyActionScenario,
  vorgang: Vorgang,
  skill: HelpySkill
): string {
  const { kunde, aufgabe } = vorgang;

  if (skill === "real-estate" && scenario === "besichtigung") {
    return `Für ${kunde.firmenname} sehe ich eine Besichtigungsanfrage. Ich habe die sinnvollsten nächsten Schritte vorbereitet.`;
  }

  if (skill === "construction" && scenario === "offertanfrage") {
    return `${kunde.ansprechpartner} wartet auf eine Offerte. Basierend auf der Anfrage empfehle ich diese Reihenfolge.`;
  }

  if (skill === "consulting-legal" && scenario === "neue-anfrage") {
    return `Neue Anfrage von ${kunde.firmenname}. Ich habe passende Schritte für Mandatsaufnahme und Erstreaktion zusammengestellt.`;
  }

  if (scenario === "frist") {
    return `Frist relevanter Vorgang: ${aufgabe.deadline ?? "bald"}. Diese Schritte sichern den rechtzeitigen Abschluss.`;
  }

  if (scenario === "rueckfrage") {
    return `${kunde.ansprechpartner} hat Rückfragen. Diese Aktionen helfen dir, schnell und präzise zu antworten.`;
  }

  return `Basierend auf „${aufgabe.titel}“ habe ich ${kunde.firmenname} analysiert und die besten nächsten Schritte ermittelt.`;
}

function prioritizeActions(actions: HelpyAction[], vorgang: Vorgang): HelpyAction[] {
  const urgencyBoost =
    vorgang.aufgabe.deadline?.toLowerCase().includes("heute") ? 2 : 0;

  return actions.map((action, index) =>
    personalizeAction(
      {
        ...action,
        priority: index + 1 - urgencyBoost * 0.1,
      },
      vorgang
    )
  );
}

export function analyzeHelpyActions({
  vorgang,
  skill,
}: AnalyzeActionsInput): HelpyActionAnalysis {
  const scenario = detectScenario(skill, vorgang);
  const scenarioConfig = getScenarioActions(skill, scenario);

  const actions = prioritizeActions(
    scenarioConfig.actions.map((action, index) =>
      sanitizeAction({
        ...action,
        priority: index + 1,
      })
    ),
    vorgang
  );

  return {
    scenario,
    scenarioLabel: scenarioConfig.label,
    analysisText: buildAnalysisText(scenario, vorgang, skill),
    actions,
  };
}
