export type DealType = "verkauf" | "vermietung";

export type DealPhase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type ProvisionStatus =
  | "ausstehend"
  | "verdient"
  | "rechnungsgestellt"
  | "bezahlt";

export type DealActivityType =
  | "phase_wechsel"
  | "notiz"
  | "kontakt"
  | "auto_erkannt";

export type DealRecord = {
  id: string;
  company_id: string;
  objekt_id: string;
  kunde_id: string | null;
  vorgang_id: string | null;
  deal_type: DealType;
  phase: DealPhase;
  phase_updated_at: string;
  provision_prozent: number | null;
  provision_chf: number | null;
  provision_mwst_prozent: number | null;
  verkaufspreis_chf: number | null;
  provision_rechnung_nr: string | null;
  provision_rechnung_url: string | null;
  provision_bezahlt_am: string | null;
  provision_status: ProvisionStatus;
  notizen: string | null;
  naechste_aktion: string | null;
  naechste_aktion_datum: string | null;
  created_at: string;
  updated_at: string;
};

export type DealWithRelations = DealRecord & {
  kunde_name: string | null;
  kunde_telefon: string | null;
  kunde_email: string | null;
};

export type DealActivityRecord = {
  id: string;
  deal_id: string;
  company_id: string;
  typ: DealActivityType;
  von_phase: number | null;
  zu_phase: number | null;
  beschreibung: string | null;
  erstellt_von: string | null;
  created_at: string;
};

export type CreateDealInput = {
  objekt_id: string;
  kunde_id?: string | null;
  vorgang_id?: string | null;
  deal_type?: DealType;
  phase?: DealPhase;
  provision_prozent?: number | null;
  provision_chf?: number | null;
  provision_mwst_prozent?: number | null;
  verkaufspreis_chf?: number | null;
  notizen?: string | null;
  naechste_aktion?: string | null;
  naechste_aktion_datum?: string | null;
};

export type DealPipelinePhaseDefinition = {
  phase: DealPhase;
  label: string;
  shortLabel: string;
};

export const DEAL_PHASES_VERKAUF: DealPipelinePhaseDefinition[] = [
  { phase: 1, label: "Neue Anfrage", shortLabel: "Anfrage" },
  { phase: 2, label: "Besichtigung vereinbart", shortLabel: "Besicht." },
  { phase: 3, label: "Besichtigung durchgeführt", shortLabel: "Besicht." },
  { phase: 4, label: "Interesse bekundet", shortLabel: "Interesse" },
  { phase: 5, label: "Kaufangebot erhalten", shortLabel: "Angebot" },
  { phase: 6, label: "In Verhandlung", shortLabel: "Verhandl." },
  { phase: 7, label: "Vertrag unterzeichnet", shortLabel: "Vertrag" },
  { phase: 8, label: "Notariat / Abschluss", shortLabel: "Notariat" },
  { phase: 9, label: "Abgeschlossen ✓", shortLabel: "Fertig" },
];

export const DEAL_PHASES_VERMIETUNG: DealPipelinePhaseDefinition[] = [
  { phase: 1, label: "Neue Anfrage", shortLabel: "Anfrage" },
  { phase: 2, label: "Besichtigung vereinbart", shortLabel: "Besicht." },
  { phase: 3, label: "Besichtigung durchgeführt", shortLabel: "Besicht." },
  { phase: 4, label: "Bewerbung erhalten", shortLabel: "Bewerbung" },
  { phase: 5, label: "Bonität geprüft", shortLabel: "Bonität" },
  { phase: 6, label: "Mietvertrag erstellt", shortLabel: "Vertrag" },
  { phase: 7, label: "Unterschrift", shortLabel: "Signatur" },
  { phase: 8, label: "Schlüsselübergabe", shortLabel: "Schlüssel" },
  { phase: 9, label: "Abgeschlossen ✓", shortLabel: "Fertig" },
];

export function getDealPhases(dealType: DealType): DealPipelinePhaseDefinition[] {
  return dealType === "vermietung" ? DEAL_PHASES_VERMIETUNG : DEAL_PHASES_VERKAUF;
}

export function getDealPhaseLabel(
  dealType: DealType,
  phase: number
): string {
  const match = getDealPhases(dealType).find((item) => item.phase === phase);
  return match?.label ?? `Phase ${phase}`;
}

export type DealPipelineAnalytics = {
  openDeals: number;
  closedThisMonth: number;
  totalOpenValueChf: number;
  conversionRates: Array<{ fromPhase: number; toPhase: number; rate: number }>;
  avgDaysPerPhase: Array<{ phase: number; avgDays: number }>;
};
