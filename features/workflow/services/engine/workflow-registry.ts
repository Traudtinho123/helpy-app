import type { WorkflowDefinition } from "@/features/workflow/services/engine/types";
import { getVorgangPath } from "@/features/workspace/services/workspace/mock-vorgaenge";

export const WORKFLOW_REGISTRY: WorkflowDefinition[] = [
  {
    id: "wf-real-estate-immoscout",
    skill: "real-estate",
    triggerType: "immoscout-anfrage",
    label: "HELPY Real Estate · ImmoScout24.ch",
    steps: [
      "interessent_erkennen",
      "interessent_anlegen",
      "besichtigung_erkennen",
      "termin_vorbereiten",
      "expose_vorbereiten",
      "aufgabe_erstellen",
      "workspace_vorbereiten",
    ],
    vorgangId: "techstart-neu",
    vorgangTitel: "Erstkontakt TechStart AG",
    resultTitel: "Immobilienanfrage vorbereitet",
    resultEmoji: "🏡",
    resultZusammenfassung:
      "HELPY hat Interessent, Besichtigung und Workspace vorbereitet.",
    helpyNachricht:
      "Ich habe die ImmoScout24.ch-Anfrage erkannt und den Vorgang vollständig vorbereitet.",
    naechsterSchritt: "Besichtigung bestätigen und Exposé prüfen",
    actions: [
      {
        id: "open-vorgang",
        label: "Vorgang öffnen",
        type: "vorgang_oeffnen",
        href: getVorgangPath("techstart-neu"),
      },
      {
        id: "mark-done",
        label: "Als erledigt markieren",
        type: "als_erledigt",
      },
    ],
  },
  {
    id: "wf-construction-offerte",
    skill: "construction",
    triggerType: "offertanfrage",
    label: "HELPY Construction · Offertanfrage",
    steps: [
      "kunde_erkennen",
      "kunde_anlegen",
      "baustelle_anlegen",
      "vor_ort_termin_vorbereiten",
      "offerte_vorbereiten",
      "materialliste_vorbereiten",
      "aufgabe_erstellen",
      "workspace_vorbereiten",
    ],
    vorgangId: "weber-angebot",
    vorgangTitel: "Angebot Weber & Co. versenden",
    resultTitel: "Offertanfrage vorbereitet",
    resultEmoji: "🔨",
    resultZusammenfassung:
      "HELPY hat Kunde, Baustelle und Offerte vorbereitet.",
    helpyNachricht:
      "Ich habe die Offertanfrage erkannt und alle Vorarbeit für Weber & Co. erledigt.",
    naechsterSchritt: "Offerte prüfen und an Thomas Müller senden",
    actions: [
      {
        id: "open-vorgang",
        label: "Vorgang öffnen",
        type: "vorgang_oeffnen",
        href: getVorgangPath("weber-angebot"),
      },
      {
        id: "open-offer",
        label: "Offerte öffnen",
        type: "offerte_oeffnen",
        href: getVorgangPath("weber-angebot"),
      },
    ],
  },
  {
    id: "wf-consulting-mandat",
    skill: "consulting-legal",
    triggerType: "mandatsanfrage",
    label: "HELPY Consulting & Legal · Mandatsanfrage",
    steps: [
      "mandant_erkennen",
      "akte_anlegen",
      "frist_erkennen",
      "erstgespraech_vorbereiten",
      "dokumente_sammeln",
      "aufgabe_erstellen",
      "workspace_vorbereiten",
    ],
    vorgangId: "finanzamt-steuer",
    vorgangTitel: "Steuerbescheid prüfen",
    resultTitel: "Mandatsanfrage vorbereitet",
    resultEmoji: "⚖",
    resultZusammenfassung:
      "HELPY hat Mandant, Frist und Erstgespräch vorbereitet.",
    helpyNachricht:
      "Ich habe die Beratungsanfrage erkannt und Mandat mit Fristenüberblick vorbereitet.",
    naechsterSchritt: "Frist prüfen und Erstgespräch bestätigen",
    actions: [
      {
        id: "open-vorgang",
        label: "Vorgang öffnen",
        type: "vorgang_oeffnen",
        href: getVorgangPath("finanzamt-steuer"),
      },
      {
        id: "check-deadline",
        label: "Frist prüfen",
        type: "frist_pruefen",
        href: getVorgangPath("finanzamt-steuer"),
      },
    ],
  },
];

export function getWorkflowDefinition(id: string): WorkflowDefinition | undefined {
  return WORKFLOW_REGISTRY.find((workflow) => workflow.id === id);
}

export function getWorkflowByTrigger(
  triggerType: WorkflowDefinition["triggerType"]
): WorkflowDefinition | undefined {
  return WORKFLOW_REGISTRY.find((workflow) => workflow.triggerType === triggerType);
}
