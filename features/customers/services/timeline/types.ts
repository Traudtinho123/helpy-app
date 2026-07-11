export type TimelineEntryType =
  | "mail"
  | "termin"
  | "angebot"
  | "dokument"
  | "whatsapp"
  | "immoscout24"
  | "website"
  | "telefon"
  | "helpy"
  | "vertrag"
  | "rechnung";

export type TimelineEntryStatus =
  | "neu"
  | "offen"
  | "erledigt"
  | "versendet"
  | "bestaetigt";

export type TimelineFilter =
  | "alle"
  | "kommunikation"
  | "dokumente"
  | "angebote"
  | "termine"
  | "helpy";

export type TimelineEntry = {
  id: string;
  customerId: string;
  type: TimelineEntryType;
  date: string;
  time: string;
  title: string;
  description: string;
  source: string;
  status?: TimelineEntryStatus;
  helpyDetected?: boolean;
};

export type TimelineDateGroup = {
  label: string;
  entries: TimelineEntry[];
};
