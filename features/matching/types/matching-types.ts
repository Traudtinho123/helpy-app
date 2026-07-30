export type SuchprofilArt = "kaufen" | "mieten";

export type SuchprofilRecord = {
  id: string;
  company_id: string;
  kunde_id: string;
  art: SuchprofilArt;
  objekttyp: string[];
  zimmer_min: number | null;
  zimmer_max: number | null;
  flaeche_min: number | null;
  flaeche_max: number | null;
  preis_max: number | null;
  lagen: string[];
  muss_kriterien: string[];
  notizen: string | null;
  aktiv: boolean;
  auto_erkannt: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateSuchprofilInput = {
  kunde_id: string;
  art?: SuchprofilArt;
  objekttyp?: string[];
  zimmer_min?: number | null;
  zimmer_max?: number | null;
  flaeche_min?: number | null;
  flaeche_max?: number | null;
  preis_max?: number | null;
  lagen?: string[];
  muss_kriterien?: string[];
  notizen?: string | null;
  aktiv?: boolean;
  auto_erkannt?: boolean;
};

export type UpdateSuchprofilInput = Partial<
  Omit<CreateSuchprofilInput, "kunde_id">
>;

export type ExtractedSuchprofil = {
  art: SuchprofilArt | null;
  objekttyp: string[];
  zimmer_min: number | null;
  zimmer_max: number | null;
  flaeche_min: number | null;
  flaeche_max: number | null;
  preis_max: number | null;
  lagen: string[];
  muss_kriterien: string[];
  confidence: number;
  sourceText: string;
};

export type ObjektMatchRecord = {
  id: string;
  company_id: string;
  objekt_id: string;
  kunde_id: string;
  suchprofil_id: string;
  score: number;
  score_details: MatchScoreBreakdown;
  notified: boolean;
  kontaktiert: boolean;
  created_at: string;
};

export type MatchScoreBreakdown = {
  preis: number;
  zimmer: number;
  lage: number;
  objekttyp: number;
  muss_kriterien: number;
};

export type ObjektMatchWithKunde = ObjektMatchRecord & {
  kunde_name: string | null;
  kunde_email: string | null;
  kunde_telefon: string | null;
};

export const MATCH_THRESHOLD = 70;

export const OBJEKTTYP_OPTIONS = [
  "Wohnung",
  "Haus",
  "Attikawohnung",
  "Maisonette",
  "Studio",
  "Gewerbe",
  "Grundstück",
] as const;

export const LAGE_SUGGESTIONS = [
  "Zürich",
  "Winterthur",
  "Bern",
  "Basel",
  "Luzern",
  "St. Gallen",
  "Genf",
  "Lausanne",
] as const;
