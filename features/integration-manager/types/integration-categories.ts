import type { IntegrationCategory } from "@/features/integration-manager/types/integration-types";

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  email: "E-Mail",
  kalender: "Kalender",
  immobilien: "Immobilien",
  "sozial-media": "Sozial Media",
  kommunikation: "Kommunikation",
  formulare: "Formulare",
  dokumente: "Dokumente",
  buchhaltung: "Buchhaltung",
  finanzen: "Finanzen",
  sap: "SAP",
};

/** Einheitliche Reihenfolge auf der Plattformen-Seite. */
export const PLATFORM_CATEGORY_ORDER: IntegrationCategory[] = [
  "email",
  "kalender",
  "immobilien",
  "sozial-media",
  "kommunikation",
  "formulare",
  "dokumente",
  "buchhaltung",
  "finanzen",
  "sap",
];

/** In der E-Mail-Sektion separat über OAuth-Karten abgedeckt. */
export const EMAIL_OAUTH_INTEGRATION_IDS = new Set(["gmail", "outlook"]);

/** In der Kalender-Sektion separat abgedeckt. */
export const CALENDAR_PLATFORM_INTEGRATION_IDS = new Set([
  "google-calendar",
  "apple-calendar",
  "outlook-calendar",
]);
