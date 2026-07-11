import { buildWorkflowTemplate } from "@/features/workflow/services/automation/workflow-template";
import type { WorkflowTemplate } from "@/features/workflow/services/automation/workflow-types";

const REAL_ESTATE_IMMOANFRAGE = buildWorkflowTemplate({
  id: "wf-re-immobilienanfrage",
  name: "Neue Immobilienanfrage",
  skill: "real-estate",
  trigger: "neue-immoscout-anfrage",
  steps: [
    {
      id: "re-1",
      title: "Interessent prüfen",
      description: "Kontaktdaten und Interesse kurz gegenprüfen.",
      required: true,
      dependsOn: [],
      reviewLabel: "pruefen",
      preparedAction: {
        kind: "crm",
        label: "Interessentenprofil",
        hint: "Kontakt und Anfrage sind bereits erfasst.",
      },
    },
    {
      id: "re-2",
      title: "Kundenakte vorbereiten",
      description: "Alle bekannten Angaben in der Kundenakte bündeln.",
      required: true,
      dependsOn: ["re-1"],
      preparedAction: {
        kind: "crm",
        label: "Kundenakte anlegen",
        hint: "Stammdaten und Verlauf werden übernommen.",
      },
    },
    {
      id: "re-3",
      title: "Objekt zuordnen",
      description: "Passendes Objekt mit der Anfrage verknüpfen.",
      required: true,
      dependsOn: ["re-2"],
      preparedAction: {
        kind: "crm",
        label: "Objekt zuweisen",
        hint: "Objekt und Exposé-Referenz sind vorbereitet.",
      },
    },
    {
      id: "re-4",
      title: "Exposé vorbereiten",
      description: "Unterlagen für den Interessenten zusammenstellen.",
      required: true,
      dependsOn: ["re-3"],
      preparedAction: {
        kind: "dokument",
        label: "Exposé erstellen",
        hint: "Entwurf mit Objektdaten liegt bereit.",
      },
    },
    {
      id: "re-5",
      title: "Besichtigung vorschlagen",
      description: "Terminvorschlag und Einladung vorbereiten.",
      required: true,
      dependsOn: ["re-4"],
      preparedAction: {
        kind: "kalender",
        label: "Besichtigung planen",
        hint: "Vorschlag für Datum und Uhrzeit ist vorbereitet.",
      },
    },
    {
      id: "re-6",
      title: "Nachfass-Aufgabe vorbereiten",
      description: "Erinnerung für das Follow-up nach der Besichtigung.",
      required: true,
      dependsOn: ["re-5"],
      preparedAction: {
        kind: "allgemein",
        label: "Nachfassen planen",
        hint: "Aufgabe mit sinnvollem Zeitpunkt ist angelegt.",
      },
    },
  ],
});

const CONSTRUCTION_OFFERTE = buildWorkflowTemplate({
  id: "wf-hw-offertanfrage",
  name: "Neue Offertanfrage",
  skill: "construction",
  trigger: "neue-offerte",
  steps: [
    {
      id: "hw-1",
      title: "Kunde vorbereiten",
      description: "Ansprechpartner und Kontext zur Anfrage festhalten.",
      required: true,
      dependsOn: [],
      reviewLabel: "pruefen",
      preparedAction: {
        kind: "crm",
        label: "Kundenprofil",
        hint: "Kontakt und Anfrage sind erfasst.",
      },
    },
    {
      id: "hw-2",
      title: "Baustelle vorbereiten",
      description: "Adresse und Rahmenbedingungen für die Baustelle anlegen.",
      required: true,
      dependsOn: ["hw-1"],
      preparedAction: {
        kind: "crm",
        label: "Baustelle anlegen",
        hint: "Standort und Kurznotiz sind vorbereitet.",
      },
    },
    {
      id: "hw-3",
      title: "Besichtigung vorbereiten",
      description: "Vor-Ort-Termin und Checkliste vorbereiten.",
      required: true,
      dependsOn: ["hw-2"],
      preparedAction: {
        kind: "kalender",
        label: "Besichtigung planen",
        hint: "Terminvorschlag liegt bereit.",
      },
    },
    {
      id: "hw-4",
      title: "Materialliste vorbereiten",
      description: "Voraussichtliche Materialien und Mengen skizzieren.",
      required: true,
      dependsOn: ["hw-3"],
      preparedAction: {
        kind: "dokument",
        label: "Materialliste",
        hint: "Erste Positionen sind vorgeschlagen.",
      },
    },
    {
      id: "hw-5",
      title: "Offerte vorbereiten",
      description: "Angebotspositionen und Summe als Entwurf.",
      required: true,
      dependsOn: ["hw-4"],
      preparedAction: {
        kind: "angebot",
        label: "Offerte erstellen",
        hint: "Entwurf mit Positionen liegt bereit.",
      },
    },
    {
      id: "hw-6",
      title: "Nachfassen vorbereiten",
      description: "Erinnerung für die Rückmeldung zum Angebot.",
      required: true,
      dependsOn: ["hw-5"],
      preparedAction: {
        kind: "allgemein",
        label: "Nachfassen planen",
        hint: "Follow-up ist terminiert.",
      },
    },
  ],
});

const CONSULTING_MANDAT = buildWorkflowTemplate({
  id: "wf-cl-mandatsanfrage",
  name: "Neue Mandatsanfrage",
  skill: "consulting-legal",
  trigger: "neues-kontaktformular",
  steps: [
    {
      id: "cl-1",
      title: "Mandant vorbereiten",
      description: "Kontakt und Anliegen in der Mandantenakte erfassen.",
      required: true,
      dependsOn: [],
      reviewLabel: "pruefen",
      preparedAction: {
        kind: "crm",
        label: "Mandantenprofil",
        hint: "Stammdaten aus der Anfrage sind übernommen.",
      },
    },
    {
      id: "cl-2",
      title: "Projekt eröffnen",
      description: "Mandat mit Titel und Kurzbeschreibung anlegen.",
      required: true,
      dependsOn: ["cl-1"],
      preparedAction: {
        kind: "crm",
        label: "Projekt anlegen",
        hint: "Projektmappe ist vorbereitet.",
      },
    },
    {
      id: "cl-3",
      title: "Erstgespräch vorbereiten",
      description: "Terminvorschlag und Gesprächsleitfaden.",
      required: true,
      dependsOn: ["cl-2"],
      preparedAction: {
        kind: "kalender",
        label: "Erstgespräch planen",
        hint: "Termin und Agenda liegen bereit.",
      },
    },
    {
      id: "cl-4",
      title: "Dokumente vorbereiten",
      description: "Checkliste und erste Unterlagen sammeln.",
      required: true,
      dependsOn: ["cl-3"],
      preparedAction: {
        kind: "dokument",
        label: "Dokumentenmappe",
        hint: "Liste der benötigten Unterlagen ist erstellt.",
      },
    },
    {
      id: "cl-5",
      title: "Fristen prüfen",
      description: "Relevante Fristen erkennen und sichern.",
      required: true,
      dependsOn: ["cl-4"],
      preparedAction: {
        kind: "kalender",
        label: "Fristen sichern",
        hint: "Erste Fristen sind im Blick.",
      },
    },
    {
      id: "cl-6",
      title: "Angebot vorbereiten",
      description: "Honorarvorschlag als Entwurf.",
      required: true,
      dependsOn: ["cl-5"],
      preparedAction: {
        kind: "angebot",
        label: "Angebot erstellen",
        hint: "Entwurf für das Erstgespräch liegt bereit.",
      },
    },
  ],
});

/** Fallback: E-Mail-basierter Ablauf je Skill */
const REAL_ESTATE_EMAIL = buildWorkflowTemplate({
  id: "wf-re-email",
  name: "Neue Immobilienanfrage",
  skill: "real-estate",
  trigger: "neue-email",
  steps: REAL_ESTATE_IMMOANFRAGE.steps,
});

const CONSTRUCTION_EMAIL = buildWorkflowTemplate({
  id: "wf-hw-email",
  name: "Neue Anfrage",
  skill: "construction",
  trigger: "neue-email",
  steps: CONSTRUCTION_OFFERTE.steps,
});

const CONSULTING_FRIST = buildWorkflowTemplate({
  id: "wf-cl-frist",
  name: "Neue Frist",
  skill: "consulting-legal",
  trigger: "neue-frist",
  steps: CONSULTING_MANDAT.steps,
});

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  REAL_ESTATE_IMMOANFRAGE,
  REAL_ESTATE_EMAIL,
  CONSTRUCTION_OFFERTE,
  CONSTRUCTION_EMAIL,
  CONSULTING_MANDAT,
  CONSULTING_FRIST,
];

export function getWorkflowTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((template) => template.id === id);
}

export function getWorkflowTemplatesForSkill(
  skill: WorkflowTemplate["skill"]
): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((template) => template.skill === skill);
}
