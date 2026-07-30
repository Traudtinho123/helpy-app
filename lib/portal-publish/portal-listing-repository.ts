import type {
  ObjektPortalListing,
  PortalDurationDays,
  PortalStatsMap,
  PortalStatusMap,
} from "@/features/portal-publish/types/portal-publish-types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const devListings = new Map<string, ObjektPortalListing>();

function generateDevId(prefix: string): string {
  return `dev-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function asStatusMap(value: unknown): PortalStatusMap {
  if (!value || typeof value !== "object") return {};
  return value as PortalStatusMap;
}

function asStatsMap(value: unknown): PortalStatsMap {
  if (!value || typeof value !== "object") return {};
  return value as PortalStatsMap;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function rowToListing(row: Record<string, unknown>): ObjektPortalListing {
  const duration = Number(row.duration_days);
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    objekt_id: String(row.objekt_id),
    immoscout_id:
      typeof row.immoscout_id === "string" ? row.immoscout_id : null,
    homegate_id: typeof row.homegate_id === "string" ? row.homegate_id : null,
    immoscout_url:
      typeof row.immoscout_url === "string" ? row.immoscout_url : null,
    homegate_url:
      typeof row.homegate_url === "string" ? row.homegate_url : null,
    portal_status: asStatusMap(row.portal_status),
    portal_published_at:
      typeof row.portal_published_at === "string"
        ? row.portal_published_at
        : null,
    duration_days: ([7, 30, 90].includes(duration)
      ? duration
      : 30) as PortalDurationDays,
    bilder_urls: asStringArray(row.bilder_urls),
    stats: asStatsMap(row.stats),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function cacheKey(companyId: string, objektId: string): string {
  return `${companyId}::${objektId}`;
}

export type UpsertPortalListingInput = {
  objekt_id: string;
  immoscout_id?: string | null;
  homegate_id?: string | null;
  immoscout_url?: string | null;
  homegate_url?: string | null;
  portal_status?: PortalStatusMap;
  portal_published_at?: string | null;
  duration_days?: PortalDurationDays;
  bilder_urls?: string[];
  stats?: PortalStatsMap;
};

export async function getPortalListingByObjekt(
  companyId: string,
  objektId: string
): Promise<ObjektPortalListing | null> {
  if (!isSupabaseConfigured()) {
    return devListings.get(cacheKey(companyId, objektId)) ?? null;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("objekt_portal_listings")
    .select("*")
    .eq("company_id", companyId)
    .eq("objekt_id", objektId)
    .maybeSingle();

  if (error) {
    console.error("[portal-listings] get failed:", error.message);
    return null;
  }

  if (!data) return null;
  return rowToListing(data as Record<string, unknown>);
}

export async function upsertPortalListing(
  companyId: string,
  input: UpsertPortalListingInput
): Promise<ObjektPortalListing> {
  const now = new Date().toISOString();
  const existing = await getPortalListingByObjekt(companyId, input.objekt_id);

  const payload = {
    company_id: companyId,
    objekt_id: input.objekt_id,
    immoscout_id: input.immoscout_id ?? existing?.immoscout_id ?? null,
    homegate_id: input.homegate_id ?? existing?.homegate_id ?? null,
    immoscout_url: input.immoscout_url ?? existing?.immoscout_url ?? null,
    homegate_url: input.homegate_url ?? existing?.homegate_url ?? null,
    portal_status: input.portal_status ?? existing?.portal_status ?? {},
    portal_published_at:
      input.portal_published_at !== undefined
        ? input.portal_published_at
        : existing?.portal_published_at ?? null,
    duration_days: input.duration_days ?? existing?.duration_days ?? 30,
    bilder_urls: input.bilder_urls ?? existing?.bilder_urls ?? [],
    stats: input.stats ?? existing?.stats ?? {},
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    const listing: ObjektPortalListing = {
      id: existing?.id ?? generateDevId("portal"),
      ...payload,
      duration_days: payload.duration_days as PortalDurationDays,
      created_at: existing?.created_at ?? now,
    };
    devListings.set(cacheKey(companyId, input.objekt_id), listing);
    return listing;
  }

  const supabase = await createClient();
  if (!supabase) {
    const listing: ObjektPortalListing = {
      id: existing?.id ?? generateDevId("portal"),
      ...payload,
      duration_days: payload.duration_days as PortalDurationDays,
      created_at: existing?.created_at ?? now,
    };
    return listing;
  }

  const { data, error } = await supabase
    .from("objekt_portal_listings")
    .upsert(payload as never, { onConflict: "company_id,objekt_id" })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[portal-listings] upsert failed:", error?.message);
    const listing: ObjektPortalListing = {
      id: existing?.id ?? generateDevId("portal"),
      ...payload,
      duration_days: payload.duration_days as PortalDurationDays,
      created_at: existing?.created_at ?? now,
    };
    return listing;
  }

  return rowToListing(data as Record<string, unknown>);
}
