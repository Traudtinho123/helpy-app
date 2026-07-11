/** Platform Layer — externe Systeme, die HELPY Connect anbindet. */

export type PlatformStatus = "connected" | "available" | "coming_soon";

export type PlatformCategory =
  | "kommunikation"
  | "immobilien"
  | "website"
  | "kalender"
  | "speicher"
  | "buchhaltung";

export type PlatformDefinition = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: PlatformCategory;
  status: PlatformStatus;
  connectProviderId?: string;
};

export const PLATFORM_CATEGORY_LABELS: Record<PlatformCategory, string> = {
  kommunikation: "Kommunikation",
  immobilien: "Immobilien",
  website: "Website & Leads",
  kalender: "Kalender",
  speicher: "Speicher",
  buchhaltung: "Buchhaltung",
};

export const PLATFORM_STATUS_LABELS: Record<PlatformStatus, string> = {
  connected: "Verbunden",
  available: "Verbinden",
  coming_soon: "Bald verfügbar",
};
