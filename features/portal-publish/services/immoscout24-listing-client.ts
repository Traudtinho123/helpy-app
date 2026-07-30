import type {
  PortalListingPayload,
  PortalPublishResult,
} from "@/features/portal-publish/types/portal-publish-types";

export type ImmoScout24PublishConfig = {
  apiKey?: string;
  customerId?: string;
  apiBaseUrl?: string;
};

/**
 * ImmoScout24.ch Listing-Client (REST-Adapter).
 * Ohne echte Partner-API-Docs: sauberer Adapter mit klaren Fehlern.
 * Bei fehlenden Keys: configured=false, kein Fake-Erfolg.
 */
export class ImmoScout24ListingClient {
  constructor(private readonly config: ImmoScout24PublishConfig = {}) {}

  get isConfigured(): boolean {
    return Boolean(this.config.apiKey?.trim() && this.config.customerId?.trim());
  }

  get apiBaseUrl(): string {
    return (
      this.config.apiBaseUrl?.trim() ||
      process.env.IMMOSCOUT24_API_BASE_URL?.trim() ||
      "https://api.immoscout24.ch/v1"
    );
  }

  async publishListing(
    payload: PortalListingPayload
  ): Promise<PortalPublishResult> {
    if (!this.isConfigured) {
      return {
        portal: "immoscout24",
        configured: false,
        success: false,
        error: "API nicht konfiguriert",
      };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "X-Customer-Id": this.config.customerId!,
        },
        body: JSON.stringify({
          customerId: this.config.customerId,
          title: payload.title,
          description: payload.description,
          price: payload.price,
          numberOfRooms: payload.numberOfRooms,
          livingSpace: payload.livingSpace,
          address: payload.address,
          availableFrom: payload.availableFrom,
          category: payload.category,
          offerType: payload.transaction,
          attachments: payload.attachments,
          publicationDurationDays: payload.durationDays,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        return {
          portal: "immoscout24",
          configured: true,
          success: false,
          error: `ImmoScout24 API-Fehler (${response.status}): ${
            detail.slice(0, 240) || response.statusText
          }`,
        };
      }

      const data = (await response.json().catch(() => ({}))) as {
        id?: string;
        listingId?: string;
        url?: string;
        listingUrl?: string;
      };

      const listingId = data.id ?? data.listingId ?? null;
      const listingUrl =
        data.url ??
        data.listingUrl ??
        (listingId
          ? `https://www.immoscout24.ch/expose/${listingId}`
          : null);

      return {
        portal: "immoscout24",
        configured: true,
        success: true,
        listingId,
        listingUrl,
      };
    } catch (error) {
      return {
        portal: "immoscout24",
        configured: true,
        success: false,
        error:
          error instanceof Error
            ? `ImmoScout24 Verbindungsfehler: ${error.message}`
            : "ImmoScout24 Verbindungsfehler",
      };
    }
  }

  async fetchStats(listingId: string): Promise<{
    available: boolean;
    views: number | null;
    inquiries: number | null;
    conversion: number | null;
    message?: string;
  }> {
    if (!this.isConfigured) {
      return {
        available: false,
        views: null,
        inquiries: null,
        conversion: null,
        message: "API nicht konfiguriert",
      };
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/listings/${encodeURIComponent(listingId)}/stats`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
            "X-Customer-Id": this.config.customerId!,
          },
        }
      );

      if (!response.ok) {
        return {
          available: false,
          views: null,
          inquiries: null,
          conversion: null,
          message: `Statistiken nicht verfügbar (${response.status})`,
        };
      }

      const data = (await response.json()) as {
        views?: number;
        inquiries?: number;
        conversion?: number;
      };

      return {
        available: true,
        views: data.views ?? null,
        inquiries: data.inquiries ?? null,
        conversion: data.conversion ?? null,
      };
    } catch {
      return {
        available: false,
        views: null,
        inquiries: null,
        conversion: null,
        message: "Statistiken konnten nicht geladen werden",
      };
    }
  }
}

export function createImmoScout24ListingClient(
  config?: ImmoScout24PublishConfig
): ImmoScout24ListingClient {
  return new ImmoScout24ListingClient({
    apiKey: config?.apiKey ?? process.env.IMMOSCOUT24_API_KEY,
    customerId: config?.customerId ?? process.env.IMMOSCOUT24_CUSTOMER_ID,
    apiBaseUrl: config?.apiBaseUrl,
  });
}
