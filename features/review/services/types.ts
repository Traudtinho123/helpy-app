import type { ActionTypeId } from "@/features/review/services/actions/types";

export type ReviewKind =
  | "antwort"
  | "angebot"
  | "termin"
  | "kunde"
  | "frist"
  | "allgemein";

export type AntwortReviewContent = {
  kind: "antwort";
  betreff: string;
  empfaenger: string;
  tonalitaet: string;
  antworttext: string;
  primaryLabel:
    | "Bestätigen & über Gmail senden"
    | "Bestätigen & über Outlook senden"
    | "Antwort senden & Termin bestätigen";
  fehlendeAngaben?: string[];
  anhaenge?: string[];
};

export type AngebotReviewContent = {
  kind: "angebot";
  kunde: string;
  positionen: string[];
  summe: string;
  fehlendeAngaben: string[];
  primaryLabel: "Angebot prüfen";
};

export type TerminReviewContent = {
  kind: "termin";
  kunde: string;
  anlass?: string;
  datum: string;
  uhrzeit: string;
  dauer?: string;
  ort: string;
  kalender?: string;
  teilnehmer?: string;
  beschreibung?: string;
  primaryLabel: "Termin bestätigen" | "Bestätigen & im Kalender speichern";
};

export type KundeReviewContent = {
  kind: "kunde";
  name: string;
  firma: string;
  email: string;
  telefon: string;
  primaryLabel: "Kundenakte bestätigen";
};

export type FristReviewContent = {
  kind: "frist";
  frist: string;
  grund: string;
  kalenderhinweis: string;
  primaryLabel: "Frist bestätigen";
};

export type AllgemeinReviewContent = {
  kind: "allgemein";
  zusammenfassung: string;
  details: string[];
  primaryLabel: "Bestätigen" | "Archivierung bestätigen" | "Kundenakte bestätigen";
};

export type ReviewContent =
  | AntwortReviewContent
  | AngebotReviewContent
  | TerminReviewContent
  | KundeReviewContent
  | FristReviewContent
  | AllgemeinReviewContent;

export type HelpyReview = {
  id: string;
  instanceId: string;
  actionTypeId: ActionTypeId;
  actionTitle: string;
  title: string;
  helpyHint: string;
  content: ReviewContent;
};

export type ReviewConfirmResult = {
  instanceId: string;
  confirmed: boolean;
  helpyMessage: string;
};

import {
  HELPY_PANEL_REVIEW_INTRO,
  HELPY_PREPARED_LABEL,
} from "@/features/review/services/safety/review-mode";

export const REVIEW_MODAL_TITLE = HELPY_PREPARED_LABEL;

export const REVIEW_HELPY_HINT = HELPY_PANEL_REVIEW_INTRO;

export const REVIEW_CONFIRM_MESSAGE =
  "Bestätigt. Nichts wurde automatisch versendet oder gebucht.";

export const REVIEW_KIND_FOR_ACTION: Partial<
  Record<ActionTypeId, ReviewKind>
> = {
  "antwort-vorbereiten": "antwort",
  "angebot-vorbereiten": "angebot",
  "offerte-vorbereiten": "angebot",
  "besichtigung-planen": "termin",
  "baustellenbesichtigung-planen": "termin",
  "erstgespraech-planen": "termin",
  "rueckruf-planen": "termin",
  "kunde-anlegen": "kunde",
  "interessent-anlegen": "kunde",
  "mandant-anlegen": "kunde",
  "frist-sichern": "frist",
};
