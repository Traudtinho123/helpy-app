import type { ObjectImage } from "@/features/real-estate/object/object-image-types";

export type RealEstateObjectSource =
  | "ImmoScout24.ch"
  | "Homegate"
  | "Newhome"
  | "Flatfox"
  | "Website Anfrage";

export type RealEstateObjectTransaction = "Kauf" | "Miete";

export type RealEstateObjectStatus =
  | "vorbereitet"
  | "aktiv"
  | "entwurf"
  | "reserviert"
  | "verkauft"
  | "vermietet"
  | "archiviert";

export type RealEstateObjectInteressentLink = {
  vorgangId: string;
  email: string;
  name: string;
};

export type RealEstateObject = {
  objectId: string;
  quelle: RealEstateObjectSource;
  adresse: string;
  plz: string;
  ort: string;
  land: string;
  titel: string;
  beschreibung: string;
  transaktion: RealEstateObjectTransaction | null;
  preis: string | null;
  zimmer: string | null;
  wohnflaeche: string | null;
  stockwerk: string | null;
  baujahr?: string | null;
  verfuegbarkeit?: string | null;
  objektLink: string | null;
  status: RealEstateObjectStatus;
  aktiv: boolean;
  interessentLinks: RealEstateObjectInteressentLink[];
  vorgangIds: string[];
  besichtigungIds: string[];
  dokumentIds: string[];
  images: ObjectImage[];
  createdAt: string;
  updatedAt: string;
};

export type RealEstateObjectDetectionInput = {
  from: string;
  subject: string;
  snippet: string;
  quelle?: string;
  detectedContext?: string[];
};

export type RealEstateObjectFieldExtraction = {
  adresse: string | null;
  plz: string | null;
  ort: string | null;
  land: string | null;
  titel: string | null;
  beschreibung: string | null;
  transaktion: RealEstateObjectTransaction | null;
  preis: string | null;
  zimmer: string | null;
  wohnflaeche: string | null;
  stockwerk: string | null;
  objektLink: string | null;
};

export const REAL_ESTATE_OBJECT_STATUS_LABELS: Record<
  RealEstateObjectStatus,
  string
> = {
  vorbereitet: "Vorbereitet",
  aktiv: "Aktiv",
  entwurf: "Entwurf",
  reserviert: "Reserviert",
  verkauft: "Verkauft",
  vermietet: "Vermietet",
  archiviert: "Archiviert",
};

export const ADD_OBJECT_STATUS_OPTIONS: Array<{
  value: RealEstateObjectStatus;
  label: string;
}> = [
  { value: "aktiv", label: "Aktiv" },
  { value: "entwurf", label: "Entwurf" },
  { value: "reserviert", label: "Reserviert" },
  { value: "verkauft", label: "Verkauft" },
  { value: "vermietet", label: "Vermietet" },
];

export const HELPY_OBJECT_CARD_TITLE = "Objekt erkannt";
export const HELPY_OBJECT_CARD_HINT =
  "Ich habe die Immobilie erkannt und als Objekt vorbereitet. Bitte prüfe die Angaben.";
export const HELPY_BUTTON_OBJEKT_OEFFNEN = "Objekt öffnen";
