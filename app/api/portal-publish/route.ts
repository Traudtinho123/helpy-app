import { NextResponse } from "next/server";
import type { PublishPortalsInput } from "@/features/portal-publish/types/portal-publish-types";
import {
  getPortalConfigStatus,
  publishObjectToPortals,
  refreshPortalStats,
} from "@/features/portal-publish/services/portal-publish-service";
import { getPortalListingByObjekt } from "@/lib/portal-publish/portal-listing-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const objektId = url.searchParams.get("objekt_id")?.trim();
  const refreshStats = url.searchParams.get("refresh_stats") === "1";

  if (!objektId) {
    return NextResponse.json(
      { error: "objekt_id ist Pflicht.", config: getPortalConfigStatus() },
      { status: 400 }
    );
  }

  let listing = await getPortalListingByObjekt(context.companyId, objektId);
  if (refreshStats && listing) {
    listing = await refreshPortalStats(context.companyId, objektId);
  }

  return NextResponse.json({
    listing,
    config: getPortalConfigStatus(),
  });
}

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: PublishPortalsInput;
  try {
    body = (await request.json()) as PublishPortalsInput;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (!body.objekt_id?.trim()) {
    return NextResponse.json(
      { error: "objekt_id ist Pflicht." },
      { status: 400 }
    );
  }

  if (!body.object_snapshot) {
    return NextResponse.json(
      { error: "object_snapshot ist Pflicht." },
      { status: 400 }
    );
  }

  const portals = (body.portals ?? []).filter(
    (portal) => portal === "immoscout24" || portal === "homegate"
  );

  if (portals.length === 0) {
    return NextResponse.json(
      { error: "Bitte mindestens ein Portal auswählen." },
      { status: 400 }
    );
  }

  const duration =
    body.duration_days === 7 || body.duration_days === 90
      ? body.duration_days
      : 30;

  const result = await publishObjectToPortals(context.companyId, {
    objekt_id: body.objekt_id.trim(),
    portals,
    duration_days: duration,
    object_snapshot: body.object_snapshot,
  });

  return NextResponse.json(result);
}
