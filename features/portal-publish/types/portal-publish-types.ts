export type PortalId = "immoscout24" | "homegate" | "comparis";

export type PortalDurationDays = 7 | 30 | 90;

export type PortalListingStatus =
  | "entwurf"
  | "live"
  | "abgelaufen"
  | "fehler"
  | "nicht_konfiguriert";

export type PortalStatusEntry = {
  status: PortalListingStatus;
  publishedAt?: string | null;
  listingId?: string | null;
  listingUrl?: string | null;
  error?: string | null;
  durationDays?: PortalDurationDays | null;
};

export type PortalStatsEntry = {
  views: number | null;
  inquiries: number | null;
  conversion: number | null;
  available: boolean;
  message?: string | null;
};

export type PortalStatusMap = Partial<Record<PortalId, PortalStatusEntry>>;
export type PortalStatsMap = Partial<Record<PortalId, PortalStatsEntry>>;

export type ObjektPortalListing = {
  id: string;
  company_id: string;
  objekt_id: string;
  immoscout_id: string | null;
  homegate_id: string | null;
  immoscout_url: string | null;
  homegate_url: string | null;
  portal_status: PortalStatusMap;
  portal_published_at: string | null;
  duration_days: PortalDurationDays;
  bilder_urls: string[];
  stats: PortalStatsMap;
  created_at: string;
  updated_at: string;
};

export type PublishPortalsInput = {
  objekt_id: string;
  portals: PortalId[];
  duration_days: PortalDurationDays;
  /** Snapshot der Objektfelder — Objekte sind clientseitig. */
  object_snapshot: PortalObjectSnapshot;
};

export type PortalObjectSnapshot = {
  objectId: string;
  titel: string;
  beschreibung: string;
  preis: string | null;
  transaktion: "Kauf" | "Miete" | null;
  zimmer: string | null;
  wohnflaeche: string | null;
  adresse: string;
  plz: string;
  ort: string;
  land: string;
  verfuegbarkeit: string | null;
  stockwerk: string | null;
  baujahr: string | null;
  imageUrls: string[];
};

/** HELPY → ImmoScout24 / Homegate Listing-Payload */
export type PortalListingPayload = {
  title: string;
  description: string;
  price: {
    value: number | null;
    currency: "CHF";
    interval: "MONTH" | "TOTAL";
  };
  numberOfRooms: number | null;
  livingSpace: number | null;
  address: {
    street: string;
    postalCode: string;
    locality: string;
    country: string;
  };
  availableFrom: string | null;
  category: "APARTMENT" | "HOUSE" | "COMMERCIAL" | "PLOT" | "OTHER";
  transaction: "RENT" | "BUY";
  attachments: Array<{ url: string; title?: string; isCover?: boolean }>;
  durationDays: PortalDurationDays;
};

export type PortalPublishResult = {
  portal: PortalId;
  configured: boolean;
  success: boolean;
  listingId?: string | null;
  listingUrl?: string | null;
  error?: string | null;
};

export type PortalConfigStatus = {
  immoscout24: boolean;
  homegate: boolean;
};

export const PORTAL_LABELS: Record<PortalId, string> = {
  immoscout24: "ImmoScout24",
  homegate: "Homegate",
  comparis: "Comparis / Newhome",
};

export const PORTAL_DURATION_OPTIONS: Array<{
  value: PortalDurationDays;
  label: string;
}> = [
  { value: 7, label: "7 Tage" },
  { value: 30, label: "30 Tage" },
  { value: 90, label: "90 Tage" },
];
