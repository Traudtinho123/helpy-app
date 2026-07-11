/** Einheitliches Vorgangs-Modell — sichtbar für den Nutzer, plattformunabhängig. */

export type VorgangTyp =
  /** Generische Anfrage (früher immobilien_anfrage). */
  | "anfrage"
  | "angebotsanfrage"
  | "terminwunsch"
  | "rueckruf"
  | "neuer_kunde"
  | "normale_nachricht"
  | "rechnung"
  | "frist"
  | "geschaeftsanfrage"
  | "bestandskunde"
  /** HELPY-System-Mails (Wochenbericht, Benachrichtigungen). */
  | "helpy_report";

/** @deprecated Use "anfrage" — kept for migration/compat checks. */
export type LegacyVorgangTyp = "immobilien_anfrage";

export type VorgangPriority = "kritisch" | "hoch" | "mittel" | "niedrig";

export type VorgangStatus =
  | "neu"
  | "in_bearbeitung"
  | "erledigt"
  | "wartend";

export type VorgangFilter = VorgangStatus | "alle" | "helpy_reports";

export type Vorgang = {
  id: string;
  typ: VorgangTyp;
  /** Brain Intent (intern) */
  intent?: string;
  intentLabel?: string;
  titel: string;
  emoji: string;
  kunde: string;
  quelle: string;
  prioritaet: VorgangPriority;
  status: VorgangStatus;
  /** Kurz-Zusammenfassung */
  summary?: string;
  /** Erkannter Kontext */
  detectedContext?: string[];
  /** Nächster Schritt */
  recommendedNextStep?: string;
  /** Vorbereitete Aktionen */
  preparedActions?: string[];
  /** Erstellte Objekte */
  createdObjects?: string[];
  helpyEmpfehlung: string;
  helpyMessage?: string;
  receivedAt: string;
  receivedLabel: string;
  href?: string;
  kundenAkteId?: string;
  sourceEventId?: string;
  threadId?: string;
  snippet?: string;
  skill?: string;
  /** Nutzer-sichtbarer Skill-Name, z. B. HELPY Real Estate */
  skillLabel?: string;
  /** Nutzer-sichtbarer HELPY-Status */
  helpyStatus?: string;
  from?: string;
  emailDate?: string;
  /** Mail-Provider für Dedup und Send-Flow */
  mailProvider?: "gmail" | "outlook";
  /** OAuth-Verbindung für Anhang-Proxy */
  mailConnectionId?: string;
  /** Anhänge aus der Korrespondenz (Metadaten — Bytes via API-Proxy) */
  mailAttachments?: import("@/features/mail/types/unified-mail-types").UnifiedMailAttachment[];
  /** Letzte Thread-Nachricht: incoming = Kunde, outgoing = Unternehmen */
  latestMessageDirection?: "incoming" | "outgoing";
  latestMessageFrom?: string;
  latestMessageAt?: string;
  hasUnreadExternalMessage?: boolean;
  /** Soft-Delete: ISO-Zeitstempel — Vorgang aus Listen ausblenden (persistiert separat). */
  hiddenAt?: string | null;
  /** HELPY Reports: Gelesen-Zeitpunkt (client-seitig persistiert). */
  helpyReportReadAt?: string | null;
};

export const VORGANG_TYP_LABELS: Record<VorgangTyp, string> = {
  anfrage: "Neue Anfrage",
  angebotsanfrage: "Angebotsanfrage",
  terminwunsch: "Terminwunsch",
  rueckruf: "Rückruf gewünscht",
  neuer_kunde: "Neuer Kunde",
  normale_nachricht: "Normale Nachricht",
  rechnung: "Rechnung",
  frist: "Frist",
  geschaeftsanfrage: "Geschäftsanfrage",
  bestandskunde: "Bestandskunden-Kommunikation",
  helpy_report: "HELPY Report",
};

/** True for inquiry-like Vorgänge (incl. legacy immobilien_anfrage string). */
export function isInquiryVorgangTyp(typ: string | undefined | null): boolean {
  return typ === "anfrage" || typ === "immobilien_anfrage";
}

export const VORGANG_PRIORITY_LABELS: Record<VorgangPriority, string> = {
  kritisch: "Kritisch",
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

export const VORGANG_STATUS_LABELS: Record<VorgangStatus, string> = {
  neu: "Neu",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
  wartend: "Warten auf Antwort",
};

export const VORGANG_FILTER_LABELS: Record<VorgangFilter, string> = {
  alle: "Alle",
  neu: "Neu",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
  wartend: "Warten auf Antwort",
  helpy_reports: "HELPY Reports",
};
