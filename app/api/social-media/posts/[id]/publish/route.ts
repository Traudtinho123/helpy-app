import { NextResponse } from "next/server";
import { publishToLinkedIn } from "@/features/social-media/services/linkedin-publish-client";
import { publishSocialPost } from "@/features/social-media/services/meta-publish-client";
import {
  getSocialPostById,
  updateSocialPost,
} from "@/lib/social-media/social-media-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(
  request: Request,
  contextParams: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await contextParams.params;
  const post = await getSocialPostById(context.companyId, id);
  if (!post) {
    return NextResponse.json({ error: "Post nicht gefunden." }, { status: 404 });
  }

  let body: {
    textContent?: string;
    hashtags?: string[];
    imageUrl?: string | null;
    title?: string;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const message = body.textContent ?? post.textContent ?? "";
  const hashtags = body.hashtags ?? post.hashtags;
  const imageUrl = body.imageUrl !== undefined ? body.imageUrl : post.imageUrl;

  const result =
    post.platform === "linkedin"
      ? await publishToLinkedIn({
          companyId: context.companyId,
          message,
          hashtags,
          imageUrl,
          title: body.title ?? "Immobilie",
        })
      : await publishSocialPost({
          companyId: context.companyId,
          platform: post.platform,
          message,
          hashtags,
          imageUrl,
        });

  if ("error" in result) {
    await updateSocialPost(context.companyId, post.id, {
      status: "failed",
      errorMessage: result.error,
    });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const updated = await updateSocialPost(context.companyId, post.id, {
    textContent: message,
    hashtags,
    imageUrl,
    status: "published",
    publishedAt: new Date().toISOString(),
    platformPostId: result.postId,
    errorMessage: null,
  });

  return NextResponse.json({ post: updated, platformPostId: result.postId });
}
