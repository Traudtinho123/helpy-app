export type KundeDbStatus = "interessent" | "aktiv" | "bestandskunde";

export type CreateKundeInput = {
  vorname: string;
  nachname: string;
  firma?: string | null;
  email?: string | null;
  telefon?: string | null;
  adresse?: string | null;
  notizen?: string | null;
  status?: KundeDbStatus;
};

export type KundeRecord = {
  id: string;
  user_id: string;
  company_id: string;
  firmenname: string;
  ansprechpartner: string | null;
  email: string | null;
  telefon: string | null;
  adresse: string | null;
  notizen: string | null;
  status: KundeDbStatus;
  erstellt_am: string;
  letzter_kontakt: string | null;
  letzter_deal_abschluss: string | null;
  letzter_deal_id: string | null;
  letzter_deal_objekt_id: string | null;
  nurturing_aktiv: boolean;
};

export type KundeDuplicateMatch = {
  id: string;
  firmenname: string;
  ansprechpartner: string | null;
  email: string | null;
  telefon: string | null;
  matchedBy: "email" | "telefon";
};
