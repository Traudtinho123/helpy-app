import { selectWorkflowTemplate } from "@/features/workflow/services/automation/workflow-rules";
import type { ResolveWorkflowInput } from "@/features/workflow/services/automation/workflow-types";
import type { DecisionContext } from "@/features/workspace/services/decision/decision-types";

export type DecisionRuleOutcome = {
  workflowTemplateId: string;
  workflowName: string;
  focusStepId: string;
  focusStepTitle: string;
  warum: string;
  entscheidungSummary: string;
  automatischVorbereiten: string[];
  benoetigtBestaetigung: string[];
  aktionLabels: string[];
  dokumentNames: string[];
};

function buildResolveInput(context: DecisionContext): ResolveWorkflowInput {
  return {
    vorgangId: context.vorgangId,
    skill: context.skill,
    intent: context.intent,
    sourceEventId: context.sourceEventId,
    titel: context.titel,
  };
}

function pickFocusStep(
  templateId: string,
  context: DecisionContext
): { id: string; title: string } {
  if (context.skill === "real-estate") {
    if (context.hasKalenderBezug || context.intent === "besichtigung") {
      return { id: "re-5", title: "Besichtigung vorschlagen" };
    }
    if (context.hasDokumente) {
      return { id: "re-4", title: "Exposé vorbereiten" };
    }
    return { id: "re-1", title: "Interessent prüfen" };
  }

  if (context.skill === "construction") {
    if (context.prioritaet === "kritisch" || context.prioritaet === "hoch") {
      return { id: "hw-3", title: "Besichtigung vorbereiten" };
    }
    return { id: "hw-5", title: "Offerte vorbereiten" };
  }

  if (context.hasFrist) {
    return { id: "cl-5", title: "Fristen prüfen" };
  }
  if (context.kundenstatus === "neu") {
    return { id: "cl-3", title: "Erstgespräch vorbereiten" };
  }
  return { id: "cl-1", title: "Mandant vorbereiten" };
}

export function evaluateDecisionRules(
  context: DecisionContext
): DecisionRuleOutcome {
  const template = selectWorkflowTemplate(buildResolveInput(context));
  const focus = pickFocusStep(template.id, context);

  if (context.skill === "real-estate" && focus.id === "re-5") {
    return {
      workflowTemplateId: template.id,
      workflowName: template.name,
      focusStepId: focus.id,
      focusStepTitle: focus.title,
      warum:
        "Terminwunsch, Kalenderbezug und vollständige Angaben sprechen für einen schnellen Besichtigungsvorschlag.",
      entscheidungSummary:
        "Ich habe entschieden, zuerst die Besichtigung vorzubereiten, da bereits alle Informationen vorhanden sind.",
      automatischVorbereiten: [
        "Terminvorschlag im Kalender",
        "Einladungstext für den Interessenten",
        "Kurznotiz zum Objekt",
      ],
      benoetigtBestaetigung: [
        "Termin bestätigen",
        "Nachricht an den Interessenten freigeben",
      ],
      aktionLabels: [
        "Besichtigung vorschlagen",
        "Interessent kontaktieren",
        "Exposé anhängen",
      ],
      dokumentNames: ["Besichtigungseinladung", "Objektübersicht"],
    };
  }

  if (context.skill === "construction") {
    return {
      workflowTemplateId: template.id,
      workflowName: template.name,
      focusStepId: focus.id,
      focusStepTitle: focus.title,
      warum:
        "Die Anfrage wirkt dringlich — zuerst Baustelle und Besichtigung klären, danach Offerte und Material.",
      entscheidungSummary:
        "Ich habe entschieden, mit der Besichtigung vor Ort zu starten, bevor die Offerte finalisiert wird.",
      automatischVorbereiten: [
        "Baustellennotiz",
        "Checkliste für den Vor-Ort-Termin",
        "Entwurf für die Materialliste",
      ],
      benoetigtBestaetigung: [
        "Besichtigungstermin bestätigen",
        "Offerte vor Versand prüfen",
      ],
      aktionLabels: [
        "Besichtigung planen",
        "Materialliste skizzieren",
        "Offerte vorbereiten",
      ],
      dokumentNames: ["Baustellenblatt", "Materialliste Entwurf"],
    };
  }

  if (context.hasFrist) {
    return {
      workflowTemplateId: template.id,
      workflowName: template.name,
      focusStepId: focus.id,
      focusStepTitle: focus.title,
      warum:
        "Eine Frist ist erkennbar — zuerst Fristen sichern, dann Mandat und Unterlagen ordnen.",
      entscheidungSummary:
        "Ich habe entschieden, zuerst die Fristen zu prüfen, damit nichts übersehen wird.",
      automatischVorbereiten: [
        "Frist im Kalender",
        "Erinnerung drei Tage vorher",
        "Checkliste für Unterlagen",
      ],
      benoetigtBestaetigung: [
        "Frist bestätigen",
        "Mandant informieren",
      ],
      aktionLabels: [
        "Frist sichern",
        "Dokumente sammeln",
        "Erstgespräch vorschlagen",
      ],
      dokumentNames: ["Fristenübersicht", "Mandatsmappe"],
    };
  }

  return {
    workflowTemplateId: template.id,
    workflowName: template.name,
    focusStepId: focus.id,
    focusStepTitle: focus.title,
    warum:
      "Alle Signale sind gesammelt — ein strukturierter Ablauf bringt den Vorgang schnell in die Umsetzung.",
    entscheidungSummary:
      "Ich habe entschieden, den passenden Arbeitsablauf vorzubereiten und mit dem wichtigsten Schritt zu beginnen.",
    automatischVorbereiten: [
      "Kunden-/Mandantenprofil",
      "Erste Aufgabenliste",
      "Vorschlag für den nächsten Kontakt",
    ],
    benoetigtBestaetigung: [
      "Ersten Schritt prüfen",
      "Kontakt freigeben",
    ],
    aktionLabels: [
      "Kontakt aufnehmen",
      "Unterlagen vorbereiten",
      "Termin vorschlagen",
    ],
    dokumentNames: ["Kurzprofil", "Gesprächsnotiz"],
  };
}
