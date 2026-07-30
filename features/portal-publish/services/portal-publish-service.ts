import type {
  ObjektPortalListing,
  PortalConfigStatus,
  PortalDurationDays,
  PortalId,
  PortalObjectSnapshot,
  PortalPublishResult,
  PortalStatsEntry,
  PortalStatusEntry,
  PortalStatusMap,
  PublishPortalsInput,
} from "@/features/portal-publish/types/portal-publish-types";
import { mapObjectToPortalListing } from "@/features/portal-publish/services/map-object-to-portal";
import { createImmoScout24ListingClient } from "@/features/portal-publish/services/immoscout24-listing-client";
import { createHomegateListingClient } from "@/features/portal-publish/services/homegate-listing-client";
import {
  getPortalListingByObjekt,
  upsertPortalListing,
} from "@/lib/portal-publish/portal-listing-repository";

export function getPortalConfigStatus(): PortalConfigStatus {
  const immoscout = createImmoScout24ListingClient();
  const homegate = createHomegateListingClient();
  return {
    immoscout24: immoscout.isConfigured,
    homegate: homegate.isConfigured,
  };
}

function mergeStatus(
  current: PortalStatusMap,
  portal: PortalId,
  entry: PortalStatusEntry
): PortalStatusMap {
  return { ...current, [portal]: entry };
}

export async function publishObjectToPortals(
  companyId: string,
  input: PublishPortalsInput
): Promise<{
  listing: ObjektPortalListing;
  results: PortalPublishResult[];
  config: PortalConfigStatus;
}> {
  const config = getPortalConfigStatus();
  const payload = mapObjectToPortalListing(
    input.object_snapshot,
    input.duration_days
  );

  const existing =
    (await getPortalListingByObjekt(companyId, input.objekt_id)) ?? null;

  const results: PortalPublishResult[] = [];
  let portalStatus: PortalStatusMap = { ...(existing?.portal_status ?? {}) };
  let immoscoutId = existing?.immoscout_id ?? null;
  let homegateId = existing?.homegate_id ?? null;
  let immoscoutUrl = existing?.immoscout_url ?? null;
  let homegateUrl = existing?.homegate_url ?? null;
  const now = new Date().toISOString();
  let anyLive = false;

  const portals = input.portals.filter(
    (portal): portal is "immoscout24" | "homegate" =>
      portal === "immoscout24" || portal === "homegate"
  );

  for (const portal of portals) {
    if (portal === "immoscout24") {
      const client = createImmoScout24ListingClient();
      const result = await client.publishListing(payload);
      results.push(result);

      if (!result.configured) {
        portalStatus = mergeStatus(portalStatus, portal, {
          status: "nicht_konfiguriert",
          error: "API nicht konfiguriert",
          durationDays: input.duration_days,
        });
        continue;
      }

      if (result.success) {
        anyLive = true;
        immoscoutId = result.listingId ?? immoscoutId;
        immoscoutUrl = result.listingUrl ?? immoscoutUrl;
        portalStatus = mergeStatus(portalStatus, portal, {
          status: "live",
          publishedAt: now,
          listingId: result.listingId,
          listingUrl: result.listingUrl,
          error: null,
          durationDays: input.duration_days,
        });
      } else {
        portalStatus = mergeStatus(portalStatus, portal, {
          status: "fehler",
          error: result.error ?? "Unbekannter Fehler",
          durationDays: input.duration_days,
        });
      }
      continue;
    }

    const client = createHomegateListingClient();
    const result = await client.publishListing(payload);
    results.push(result);

    if (!result.configured) {
      portalStatus = mergeStatus(portalStatus, portal, {
        status: "nicht_konfiguriert",
        error: "API nicht konfiguriert",
        durationDays: input.duration_days,
      });
      continue;
    }

    if (result.success) {
      anyLive = true;
      homegateId = result.listingId ?? homegateId;
      homegateUrl = result.listingUrl ?? homegateUrl;
      portalStatus = mergeStatus(portalStatus, portal, {
        status: "live",
        publishedAt: now,
        listingId: result.listingId,
        listingUrl: result.listingUrl,
        error: null,
        durationDays: input.duration_days,
      });
    } else {
      portalStatus = mergeStatus(portalStatus, portal, {
        status: "fehler",
        error: result.error ?? "Unbekannter Fehler",
        durationDays: input.duration_days,
      });
    }
  }

  const listing = await upsertPortalListing(companyId, {
    objekt_id: input.objekt_id,
    immoscout_id: immoscoutId,
    homegate_id: homegateId,
    immoscout_url: immoscoutUrl,
    homegate_url: homegateUrl,
    portal_status: portalStatus,
    portal_published_at: anyLive
      ? now
      : existing?.portal_published_at ?? null,
    duration_days: input.duration_days,
    bilder_urls: input.object_snapshot.imageUrls,
    stats: existing?.stats ?? {},
  });

  return { listing, results, config };
}

export async function refreshPortalStats(
  companyId: string,
  objektId: string
): Promise<ObjektPortalListing | null> {
  const listing = await getPortalListingByObjekt(companyId, objektId);
  if (!listing) return null;

  const stats = { ...listing.stats };

  if (listing.immoscout_id) {
    const client = createImmoScout24ListingClient();
    const result = await client.fetchStats(listing.immoscout_id);
    const entry: PortalStatsEntry = {
      views: result.views,
      inquiries: result.inquiries,
      conversion: result.conversion,
      available: result.available,
      message: result.message ?? null,
    };
    stats.immoscout24 = entry;
  } else {
    stats.immoscout24 = {
      views: null,
      inquiries: null,
      conversion: null,
      available: false,
      message: "Noch nicht auf ImmoScout24 publiziert",
    };
  }

  if (listing.homegate_id) {
    const client = createHomegateListingClient();
    const result = await client.fetchStats(listing.homegate_id);
    stats.homegate = {
      views: result.views,
      inquiries: result.inquiries,
      conversion: result.conversion,
      available: result.available,
      message: result.message ?? null,
    };
  } else {
    stats.homegate = {
      views: null,
      inquiries: null,
      conversion: null,
      available: false,
      message: "Noch nicht auf Homegate publiziert",
    };
  }

  return upsertPortalListing(companyId, {
    objekt_id: listing.objekt_id,
    immoscout_id: listing.immoscout_id,
    homegate_id: listing.homegate_id,
    immoscout_url: listing.immoscout_url,
    homegate_url: listing.homegate_url,
    portal_status: listing.portal_status,
    portal_published_at: listing.portal_published_at,
    duration_days: listing.duration_days as PortalDurationDays,
    bilder_urls: listing.bilder_urls,
    stats,
  });
}

export function buildExposePreviewLines(
  snapshot: PortalObjectSnapshot
): string[] {
  const lines = [
    snapshot.titel,
    `${snapshot.adresse}, ${snapshot.plz} ${snapshot.ort}`,
    snapshot.transaktion === "Miete"
      ? `Miete: ${snapshot.preis ?? "auf Anfrage"}`
      : `Kaufpreis: ${snapshot.preis ?? "auf Anfrage"}`,
  ];
  if (snapshot.zimmer) lines.push(`${snapshot.zimmer} Zimmer`);
  if (snapshot.wohnflaeche) lines.push(`${snapshot.wohnflaeche} Wohnfläche`);
  if (snapshot.verfuegbarkeit) {
    lines.push(`Verfügbar ab: ${snapshot.verfuegbarkeit}`);
  }
  return lines;
}
