import { NextResponse } from "next/server";
import {
  listRecentSocialPosts,
  listSocialConnections,
  revokeSocialConnection,
} from "@/lib/social-media/social-media-repository";
import type { SocialConnectionPlatform } from "@/features/social-media/types/social-media-types";
import { resolveCompanyContextForReadApi } from "@/lib/tenant/resolve-company-context-for-api";
import { isLinkedInPublishingConfigured } from "@/features/social-media/services/linkedin-publish-client";
import { isMetaPublishingConfigured } from "@/features/social-media/services/meta-publish-client";

export async function GET() {
  const context = await resolveCompanyContextForReadApi();

  if (!context) {
    return NextResponse.json({
      posts: [],
      connections: [],
      config: { meta: false, linkedin: false },
      warning: "Nicht angemeldet oder kein Unternehmen zugeordnet.",
    });
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
  const context = await resolveCompanyContextForReadApi();

  if (!context) {
    return NextResponse.json(
      { error: "Nicht angemeldet oder kein Unternehmen zugeordnet." },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") as SocialConnectionPlatform | null;
  if (!platform) {
    return NextResponse.json({ error: "platform ist Pflicht." }, { status: 400 });
  }

  const ok = await revokeSocialConnection(context.companyId, platform);
  return NextResponse.json({ ok });
}
