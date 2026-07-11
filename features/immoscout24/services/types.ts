export type ImmoScout24InquiryType =
  | "kauf"
  | "miete"
  | "besichtigung"
  | "rueckruf"
  | "neu";

export type ImmoScout24Priority = "hoch" | "mittel" | "niedrig";

export type ImmoScout24InquiryStatus =
  | "neu"
  | "in_bearbeitung"
  | "besichtigung_geplant"
  | "erledigt";

/** Normalisierter ImmoScout24-Anfrage-Typ — UI konsumiert nur diese. */
export type NormalizedImmoScout24Inquiry = {
  id: string;
  name: string;
  objekt: string;
  kauf: boolean;
  miete: boolean;
  besichtigung: boolean;
  telefon: string;
  email: string;
  wunschdatum: string;
  prioritaet: ImmoScout24Priority;
  status: ImmoScout24InquiryStatus;
  receivedAt: string;
  message?: string;
  detectedTypes: ImmoScout24InquiryType[];
};

export type ImmoScout24SyncResult = {
  syncedAt: string;
  itemsSynced: number;
  success: boolean;
  errorMessage?: string;
};

export type ImmoScout24ClientConfig = {
  apiBaseUrl?: string;
  accessToken?: string;
};

export type ImmoScout24RawInquiry = {
  id: string;
  contactName: string;
  listingTitle: string;
  inquiryType: string;
  phone?: string;
  email?: string;
  preferredDate?: string;
  message?: string;
  createdAt: string;
};
