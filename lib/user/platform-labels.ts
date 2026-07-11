export const PLATFORM_LABELS: Record<string, string> = {
  gmail: "Gmail",
  "apple-calendar": "Apple Kalender",
  "google-calendar": "Google Kalender",
  outlook: "Outlook",
  "outlook-calendar": "Outlook Kalender",
  immoscout24: "ImmoScout24.ch",
  homegate: "Homegate",
  newhome: "Newhome",
  "website-formulare": "Website Formulare",
};

export function getPlatformLabel(platformId: string): string {
  return PLATFORM_LABELS[platformId] ?? platformId;
}
