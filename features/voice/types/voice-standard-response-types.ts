export type VoiceStandardResponseCategory =
  | "allgemein"
  | "objekte"
  | "termine"
  | "preise";

export type VoiceStandardResponse = {
  id: string;
  companyId: string;
  triggerText: string;
  responseText: string;
  category: VoiceStandardResponseCategory;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
};

export const VOICE_STANDARD_RESPONSE_CATEGORY_LABELS: Record<
  VoiceStandardResponseCategory,
  string
> = {
  allgemein: "Allgemein",
  objekte: "Objekte",
  termine: "Termine",
  preise: "Preise",
};

export const DEFAULT_VOICE_STANDARD_RESPONSES: Array<
  Pick<VoiceStandardResponse, "triggerText" | "responseText" | "category" | "enabled" | "sortOrder">
> = [
  {
    triggerText: "Öffnungszeiten",
    responseText: "Wir sind Montag bis Freitag von 9 bis 17 Uhr erreichbar.",
    category: "allgemein",
    enabled: true,
    sortOrder: 1,
  },
  {
    triggerText: "Wo sind Sie",
    responseText:
      "Unser Büro befindet sich am Standort aus unserem Firmenprofil. Ich kann Ihnen die genaue Adresse gerne per E-Mail zusenden.",
    category: "allgemein",
    enabled: true,
    sortOrder: 2,
  },
  {
    triggerText: "Besichtigung",
    responseText:
      "Ich kann Ihnen gerne einen Besichtigungstermin vorbereiten. Für welches Objekt interessieren Sie sich?",
    category: "termine",
    enabled: true,
    sortOrder: 3,
  },
];
