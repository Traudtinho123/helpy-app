import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type VorgangKunde = {
  firmenname: string;
  ansprechpartner: string;
  email: string;
  telefon: string;
  adresse: string;
  branche?: string;
  status: string;
};

export type VorgangAufgabe = {
  titel: string;
  kategorie: string;
  deadline?: string;
  fortschritt: number;
  empfohleneAktion: string;
};

export type VorgangEmail = {
  betreff: string;
  absender: string;
  datum: string;
  inhalt: string;
  zusammenfassung: string;
};

export type VorgangAngebotPosition = {
  bezeichnung: string;
  menge: number;
  einzelpreis: number;
};

export type VorgangAngebot = {
  angebotNr: string;
  status: string;
  positionen: VorgangAngebotPosition[];
  mwstSatz: number;
  deadline?: string;
};

export type VorgangTermin = {
  titel: string;
  datum: string;
  ort?: string;
};

export type VorgangDokument = {
  name: string;
  typ: string;
  datum: string;
};

export type VorgangHelpy = {
  /** Einleitung beim Öffnen des Workspace */
  intro?: string;
  /** Was HELPY erkannt hat */
  erkannt?: string;
  /** @deprecated — Fallback für ältere Mock-Daten */
  begruessung?: string;
  empfehlung: string;
  naechsterSchritt: string;
};

/** Zusatzinfos aus der Vorgangsliste für die Kopfzeile */
export type VorgangKopfzeile = {
  statusLabel: string;
  prioritaetLabel: string;
  quelle: string;
  intentLabel?: string;
};

export type Vorgang = {
  id: string;
  skill: HelpySkill;
  kunde: VorgangKunde;
  aufgabe: VorgangAufgabe;
  letzteEmail: VorgangEmail;
  angebot?: VorgangAngebot;
  termine: VorgangTermin[];
  dokumente: VorgangDokument[];
  notizen: string;
  helpy: VorgangHelpy;
  kopfzeile?: VorgangKopfzeile;
};
