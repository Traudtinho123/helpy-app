/** Schwellenwerte für Antwort-Timer — später aus CompanyKnowledge konfigurierbar. */
export const RESPONSE_TIMER_THRESHOLDS_MS = {
  /** Unter 1 Stunde: grün */
  yellow: 60 * 60 * 1000,
  /** 1–5 Stunden: gelb */
  orange: 5 * 60 * 60 * 1000,
  /** 5–24 Stunden: orange */
  red: 24 * 60 * 60 * 1000,
} as const;

/** Ab diesem Alter erscheint der Hinweis auf Mein Arbeitstag. */
export const RESPONSE_TIMER_STALE_ALERT_MS = RESPONSE_TIMER_THRESHOLDS_MS.orange;

export const RESPONSE_TIMER_HINTS = {
  yellow: "Schnelle Antwort empfohlen",
  orange:
    "73% der Interessenten wählen den ersten Makler, der antwortet",
  red: "Dringend — diese Anfrage wartet zu lange",
} as const;
