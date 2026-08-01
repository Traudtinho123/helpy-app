import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCompanyKnowledgeRow, rowToCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-repository";
import {
  buildSocialObjectSnapshot,
  extractHashtags,
  generateSocialPostsWithGpt,
  resolveCoverImageUrl,
  stripHashtagsFromText,
} from "@/features/social-media/services/social-post-generator";
import { SOCIAL_PLATFORMS } from "@/features/social-media/types/social-media-types";
import {
  listSocialPostsForObjekt,
  upsertSocialPosts,
} from "@/lib/social-media/social-media-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { object?: RealEstateObject; objektId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const object = body.object;
  if (!object?.objectId) {
    return NextResponse.json(
      { error: "object mit objectId ist Pflicht." },
      { status: 400 }
    );
  }

  const snapshot = buildSocialObjectSnapshot(object);
  let companyName = "Ihr Immobilienunternehmen";
  let companyStyle = "";

  const supabase = await createClient();
  if (supabase) {
    const { data: company } = await supabase
      .from("companies")
      .select("name, profile_settings")
      .eq("id", context.companyId)
      .maybeSingle();

    if (company?.name) companyName = company.name;

    const knowledgeRow = await fetchCompanyKnowledgeRow(supabase, context.companyId);
    if (knowledgeRow) {
      const knowledge = rowToCompanyKnowledge(knowledgeRow);
      companyStyle = [
        knowledge.companyDescription,
        knowledge.services.map((s) => s.name).join(", "),
        knowledge.replyStyleCustom || knowledge.replyStyle,
        knowledge.internalRules.join("; "),
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  const generated = await generateSocialPostsWithGpt({
    snapshot,
    companyName,
    companyStyle,
  });

  const imageUrl = resolveCoverImageUrl(object);

  const posts = SOCIAL_PLATFORMS.map((platform) => {
    const raw = generated[platform];
    const hashtags = extractHashtags(raw);
    const textContent = stripHashtagsFromText(raw);
    return {
      objektId: object.objectId,
      platform,
      textContent,
      hashtags,
      imageUrl,
      status: "draft" as const,
    };
  });

  const saved = await upsertSocialPosts(context.companyId, posts);

  return NextResponse.json({
    posts: saved,
    generatedWithGpt: true,
  });
}

export async function GET(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const objektId = url.searchParams.get("objekt_id")?.trim();
  if (!objektId) {
    return NextResponse.json({ error: "objekt_id ist Pflicht." }, { status: 400 });
  }

  const posts = await listSocialPostsForObjekt(context.companyId, objektId);
  return NextResponse.json({ posts });
}
