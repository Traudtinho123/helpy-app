import { NextResponse } from "next/server";
import {
  listRecentSocialPosts,
  updateSocialPost,
  upsertSocialPosts,
} from "@/lib/social-media/social-media-repository";
import type { SocialPlatform } from "@/features/social-media/types/social-media-types";
import {
  resolveCompanyContextForReadApi,
  resolveCompanyContextForWriteApi,
} from "@/lib/tenant/resolve-company-context-for-api";

export async function GET() {
  const context = await resolveCompanyContextForReadApi();
  if (!context) {
    return NextResponse.json({ posts: [], warning: "Nicht angemeldet." });
  }

  const posts = await listRecentSocialPosts(context.companyId, 100);
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const auth = await resolveCompanyContextForWriteApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const context = auth.context;

  let body: {
    platform?: SocialPlatform;
    textContent?: string;
    hashtags?: string[];
    imageUrl?: string | null;
    objektId?: string;
    scheduledAt?: string | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (!body.platform || !body.textContent?.trim()) {
    return NextResponse.json(
      { error: "platform und textContent sind Pflicht." },
      { status: 400 }
    );
  }

  const saved = await upsertSocialPosts(context.companyId, [
    {
      objektId: body.objektId?.trim() || "manual",
      platform: body.platform,
      textContent: body.textContent.trim(),
      hashtags: body.hashtags ?? [],
      imageUrl: body.imageUrl ?? null,
      status: body.scheduledAt ? "scheduled" : "draft",
    },
  ]);

  const post = saved[0];
  if (!post) {
    return NextResponse.json({ error: "Post konnte nicht gespeichert werden." }, { status: 500 });
  }

  if (body.scheduledAt) {
    const updated = await updateSocialPost(context.companyId, post.id, {
      scheduledAt: body.scheduledAt,
      status: "scheduled",
    });
    return NextResponse.json({ post: updated ?? post });
  }

  return NextResponse.json({ post });
}

export async function PATCH(request: Request) {
  const auth = await resolveCompanyContextForWriteApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const context = auth.context;

  let body: {
    postId?: string;
    textContent?: string;
    hashtags?: string[];
    imageUrl?: string | null;
    scheduledAt?: string | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (!body.postId) {
    return NextResponse.json({ error: "postId ist Pflicht." }, { status: 400 });
  }

  const updated = await updateSocialPost(context.companyId, body.postId, {
    textContent: body.textContent,
    hashtags: body.hashtags,
    imageUrl: body.imageUrl,
    scheduledAt: body.scheduledAt,
    status: body.scheduledAt ? "scheduled" : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Post nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ post: updated });
}
