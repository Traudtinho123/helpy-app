export type DetectedPlatform =
  | "immoscout24"
  | "homegate"
  | "newhome"
  | "flatfox"
  | "website";

export type PlatformInquiryField = string;

export type PlatformInquiryExtraction = {
  interessentName: PlatformInquiryField;
  interessentEmail: PlatformInquiryField;
  telefon: PlatformInquiryField;
  objektadresse: PlatformInquiryField;
  objektname: PlatformInquiryField;
  objektLink: PlatformInquiryField;
  besichtigungstermin: PlatformInquiryField;
  nachricht: PlatformInquiryField;
};

export const PLATFORM_INQUIRY_MISSING = "Nicht eindeutig erkannt";

export const PLATFORM_SOURCE_LABELS: Record<DetectedPlatform, string> = {
  immoscout24: "ImmoScout24.ch",
  homegate: "Homegate",
  newhome: "Newhome",
  flatfox: "Flatfox",
  website: "Website Anfrage",
};

export const PLATFORM_INQUIRY_RECOMMENDATION =
  "Ich empfehle, den Interessenten zu prüfen und eine Besichtigung vorzuschlagen.";

export const PLATFORM_INQUIRY_PANEL_INTRO =
  "Ich habe diese Immobilienanfrage vorbereitet. Bitte prüfe Interessent, Objekt und Terminvorschlag.";
