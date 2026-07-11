/** HELPY arbeitet immer im Prüfen-und-Bestätigen-Modus — keine Vollautomatik. */

export const HELPY_PREPARED_LABEL =
  "Von HELPY vorbereitet – bitte prüfen und bestätigen.";

export const HELPY_PANEL_REVIEW_INTRO =
  "Ich habe alles vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.";

export const HELPY_WORKSPACE_INTRO =
  "Ich habe alles vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.";

export const HELPY_WORKFLOW_INTRO =
  "Ich habe den passenden Arbeitsablauf vorbereitet. Bitte prüfe jeden Schritt und bestätige ihn.";

export const HELPY_DECISION_INTRO =
  "Ich habe eine Empfehlung vorbereitet. Bitte prüfe sie, bevor du den Arbeitsablauf öffnest.";

export const HELPY_BUTTON_PRUEFEN = "Prüfen";
export const HELPY_BUTTON_PRUEFEN_UND_BESTAETIGEN = "Prüfen und bestätigen";
export const HELPY_BUTTON_BESTAETIGEN = "Bestätigen";

export const HELPY_GMAIL_DECISION_PANEL_INTRO =
  "Ich habe den nächsten Schritt vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.";

export const HELPY_GMAIL_WORKSPACE_INTRO =
  "Ich habe diesen Vorgang aus der Original-E-Mail vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.";

export const HELPY_BUTTON_ANTWORT_PRUEFEN = "Antwort prüfen";
export const HELPY_BUTTON_TERMIN_PRUEFEN = "Termin prüfen";
export const HELPY_BUTTON_VORGANG_BESTAETIGEN = "Vorgang bestätigen";

export const HELPY_REPLY_DRAFT_PANEL_INTRO =
  "Ich habe eine Antwort vorbereitet. Bitte prüfe den Text, bevor du ihn verwendest.";

export const HELPY_ARCHIVE_RECOMMENDATION =
  "Diese Nachricht wirkt nicht wie eine relevante Kundenanfrage. Ich würde sie zum Archivieren vorbereiten.";

export const HELPY_ARCHIVE_STATUS_PREPARED = "Zum Archivieren vorbereitet";
export const HELPY_ARCHIVE_STATUS_CONFIRMED = "Archivierung bestätigt";

export const HELPY_BUTTON_ARCHIVIERUNG_PRUEFEN = "Archivierung prüfen";
export const HELPY_BUTTON_ARCHIVIERUNG_BESTAETIGEN = "Archivierung bestätigen";

export const HELPY_ARCHIVE_PANEL_INTRO =
  "Diese Nachricht wirkt nicht wie eine Kundenanfrage. Ich habe die Archivierung vorbereitet — bitte prüfe sie, bevor du bestätigst.";
export const HELPY_BUTTON_BEARBEITEN = "Bearbeiten";
export const HELPY_BUTTON_ABBRECHEN = "Abbrechen";

/** Aktionen, die HELPY nie ohne Bestätigung ausführt. */
export const HELPY_BLOCKED_AUTO_ACTIONS = [
  "E-Mails senden",
  "Termine endgültig buchen",
  "Angebote verschicken",
  "Kunden final anlegen",
  "Dokumente final freigeben",
  "Rechtliche Inhalte bestätigen",
] as const;

export function isAutoActionBlocked(_actionKind: string): boolean {
  return true;
}

export function sanitizeActionLabel(label: string): string {
  return label
    .replace(/versenden/gi, "prüfen")
    .replace(/senden/gi, "prüfen")
    .replace(/starten/gi, "prüfen")
    .replace(/setzen/gi, "prüfen")
    .replace(/anlegen/gi, "vorbereiten")
    .replace(/übernehmen/gi, "bestätigen")
    .replace(/Übernehmen/g, "Bestätigen")
    .replace(/ausführen/gi, "prüfen");
}

export function sanitizeHelpyCopy(text: string): string {
  return sanitizeActionLabel(text)
    .replace(/\bautomatisch\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
