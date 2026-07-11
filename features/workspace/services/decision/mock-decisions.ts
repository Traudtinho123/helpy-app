/** Optionale Mock-Overrides pro Vorgang — für Demo-Szenarien. */
export const MOCK_DECISION_OVERRIDES: Record<
  string,
  { entscheidungSummary: string; warum?: string }
> = {
  "pwi-evt-2": {
    entscheidungSummary:
      "Ich habe entschieden, zuerst die Besichtigung vorzubereiten, da bereits alle Informationen vorhanden sind.",
    warum:
      "Penthouse-Anfrage über ImmoScout mit klarem Besichtigungswunsch und vollständigem Objektbezug.",
  },
  "pwi-evt-5": {
    entscheidungSummary:
      "Ich habe entschieden, mit der Offerte zu starten, sobald die Baustelle und Material grob geklärt sind.",
  },
  "pwi-evt-8": {
    entscheidungSummary:
      "Ich habe entschieden, zuerst die Fristen zu prüfen, bevor weitere Schritte folgen.",
  },
  "weber-angebot": {
    entscheidungSummary:
      "Ich habe entschieden, die Offerte zuerst zu finalisieren — der Kunde wartet auf eine Rückmeldung.",
  },
};

export function getMockDecisionOverride(vorgangId: string) {
  return MOCK_DECISION_OVERRIDES[vorgangId];
}
