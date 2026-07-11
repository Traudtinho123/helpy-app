import type { HelpyDecision } from "@/features/decision/types/decision-types";
import { HELPY_BUTTON_PRUEFEN_UND_BESTAETIGEN } from "@/features/review/services/safety/review-mode";

export const DECISION_EXAMPLES: HelpyDecision[] = [
  {
    id: "helpy-decision-example-re-1",
    vorgangId: "brain-v3-example-re",
    decisionTitle: "Besichtigung priorisieren",
    reason:
      "Anna Müller möchte eine Besichtigung — Priorität hoch und vollständige Kontaktangaben sprechen für einen schnellen Terminvorschlag.",
    nextBestStep: "Besichtigungstermin vorschlagen und Einladung vorbereiten",
    preparedItems: [
      "Interessent vorbereiten",
      "Objekt prüfen",
      "Besichtigung vorschlagen",
      "Antwort vorbereiten",
      "Nachfass-Aufgabe vorbereiten",
    ],
    needsConfirmation: true,
    confirmationLabel: HELPY_BUTTON_PRUEFEN_UND_BESTAETIGEN,
    helpyMessage:
      "Ich habe den nächsten Schritt vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.",
  },
  {
    id: "helpy-decision-example-hw-1",
    vorgangId: "brain-v3-example-hw",
    decisionTitle: "Offertanfrage bearbeiten",
    reason:
      "Thomas Weber bittet um eine Offerte — zuerst Baustelle und Vor-Ort-Termin klären, danach Kalkulation und Material.",
    nextBestStep: "Vor-Ort-Termin vorschlagen und Offerte skizzieren",
    preparedItems: [
      "Kunde vorbereiten",
      "Baustelle vorbereiten",
      "Vor-Ort-Termin vorschlagen",
      "Offerte vorbereiten",
      "Materialliste vorbereiten",
    ],
    needsConfirmation: true,
    confirmationLabel: HELPY_BUTTON_PRUEFEN_UND_BESTAETIGEN,
    helpyMessage:
      "Ich habe den nächsten Schritt vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.",
  },
  {
    id: "helpy-decision-example-cl-1",
    vorgangId: "brain-v3-example-cl",
    decisionTitle: "Frist sichern",
    reason:
      "Eine Frist ist erkennbar — Dr. Keller und Unterlagen sollten zuerst gesichert werden.",
    nextBestStep: "Frist im Kalender sichern und Erinnerung vorbereiten",
    preparedItems: [
      "Mandant/Kunde vorbereiten",
      "Frist prüfen",
      "Erstgespräch vorschlagen",
      "Dokument prüfen",
      "Antwort vorbereiten",
    ],
    needsConfirmation: true,
    confirmationLabel: HELPY_BUTTON_PRUEFEN_UND_BESTAETIGEN,
    helpyMessage:
      "Ich habe den nächsten Schritt vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.",
  },
];
