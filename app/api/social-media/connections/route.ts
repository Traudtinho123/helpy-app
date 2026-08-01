import { NextResponse } from "next/server";
import {
  listRecentSocialPosts,
  listSocialConnections,
  revokeSocialConnection,
} from "@/lib/social-media/social-media-repository";
import type { SocialConnectionPlatform } from "@/features/social-media/types/social-media-types";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isLinkedInPublishingConfigured } from "@/features/social-media/services/linkedin-publish-client";
import { isMetaPublishingConfigured } from "@/features/social-media/services/meta-publish-client";

export async function GET() {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const connections = await listSocialConnections(context.companyId);
  const posts = await listRecentSocialPosts(context.companyId, 30);

  return NextResponse.json({
    connections,
    posts,
    config: {
      meta: isMetaPublishingConfigured() || connections.some((c) => c.platform === "meta" && c.connected),
      linkedin:
        isLinkedInPublishingConfigured() ||
        connections.some((c) => c.platform === "linkedin" && c.connected),
    },
  });
}

export async function DELETE(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") as SocialConnectionPlatform | null;
  if (!platform) {
    return NextResponse.json({ error: "platform ist Pflicht." }, { status: 400 });
  }

  const ok = await revokeSocialConnection(context.companyId, platform);
  return NextResponse.json({ ok });
}
