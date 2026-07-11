import type { PlatformDefinition } from "@/features/platforms/services/platform/types";

/** Zentrale Plattform-Registry — Schaltzentrale aller externen Systeme. */
export const PLATFORM_REGISTRY: PlatformDefinition[] = [
  {
    id: "gmail",
    name: "Gmail",
    emoji: "📧",
    description: "E-Mails erkennen und als Vorgänge vorbereiten.",
    category: "kommunikation",
    status: "connected",
    connectProviderId: "gmail",
  },
  {
    id: "outlook",
    name: "Outlook",
    emoji: "📨",
    description: "Outlook-Postfach anbinden und Nachrichten strukturieren.",
    category: "kommunikation",
    status: "available",
    connectProviderId: "outlook",
  },
  {
    id: "microsoft-365",
    name: "Microsoft 365",
    emoji: "☁",
    description: "Mail, Kalender und Kontakte aus Microsoft 365 vereinen.",
    category: "kommunikation",
    status: "available",
    connectProviderId: "microsoft-365",
  },
  {
    id: "immoscout24",
    name: "ImmoScout24.ch",
    emoji: "🏡",
    description: "Immobilienanfragen erkennen, priorisieren und vorbereiten.",
    category: "immobilien",
    status: "connected",
  },
  {
    id: "homegate",
    name: "Homegate",
    emoji: "🏠",
    description: "Homegate-Anfragen zentral als Vorgänge verarbeiten.",
    category: "immobilien",
    status: "available",
  },
  {
    id: "newhome",
    name: "Newhome",
    emoji: "🏘",
    description: "Newhome-Leads als Vorgänge vorbereiten.",
    category: "immobilien",
    status: "available",
  },
  {
    id: "website",
    name: "Website",
    emoji: "🌐",
    description: "Anfragen von deiner Website erkennen und vorbereiten.",
    category: "website",
    status: "connected",
  },
  {
    id: "kontaktformulare",
    name: "Kontaktformulare",
    emoji: "📋",
    description: "Formular-Eingänge strukturiert als Vorgänge bereitstellen.",
    category: "website",
    status: "connected",
    connectProviderId: "forms",
  },
  {
    id: "facebook-leads",
    name: "Facebook Leads",
    emoji: "📱",
    description: "Facebook-Lead-Anzeigen in HELPY vorbereiten.",
    category: "website",
    status: "coming_soon",
  },
  {
    id: "instagram-leads",
    name: "Instagram Leads",
    emoji: "📸",
    description: "Instagram-Anfragen als Vorgänge erkennen und vorbereiten.",
    category: "website",
    status: "coming_soon",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    emoji: "💬",
    description: "WhatsApp-Nachrichten strukturiert in Vorgänge überführen.",
    category: "kommunikation",
    status: "coming_soon",
  },
  {
    id: "google-calendar",
    name: "Google Kalender",
    emoji: "📅",
    description: "Termine und Fristen als Vorschläge in deinen Tag einplanen.",
    category: "kalender",
    status: "connected",
  },
  {
    id: "apple-calendar",
    name: "Apple Kalender / iCloud Kalender",
    emoji: "🍎",
    description: "iPhone- und iCloud-Termine lesen und in deinen Tag einbinden.",
    category: "kalender",
    status: "available",
  },
  {
    id: "outlook-calendar",
    name: "Outlook Kalender",
    emoji: "📅",
    description: "Outlook-Termine mit HELPY synchronisieren.",
    category: "kalender",
    status: "available",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    emoji: "📂",
    description: "Dokumente aus Dropbox für Vorgänge bereitstellen.",
    category: "speicher",
    status: "available",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    emoji: "☁",
    description: "OneDrive-Dateien nahtlos in Workspaces einbinden.",
    category: "speicher",
    status: "available",
  },
  {
    id: "bexio",
    name: "bexio",
    emoji: "🧾",
    description: "Rechnungen und Buchhaltung erkennen und vorbereiten.",
    category: "buchhaltung",
    status: "coming_soon",
  },
  {
    id: "abacus",
    name: "Abacus",
    emoji: "💰",
    description: "Abacus-Belege und Fristen als Vorgänge vorbereiten.",
    category: "buchhaltung",
    status: "coming_soon",
  },
];

export function getPlatformsByCategory(): Map<
  PlatformDefinition["category"],
  PlatformDefinition[]
> {
  const map = new Map<PlatformDefinition["category"], PlatformDefinition[]>();

  for (const platform of PLATFORM_REGISTRY) {
    const list = map.get(platform.category) ?? [];
    list.push(platform);
    map.set(platform.category, list);
  }

  return map;
}

export function getConnectedPlatformCount(): number {
  return PLATFORM_REGISTRY.filter((p) => p.status === "connected").length;
}
