import { NextResponse } from "next/server";
import { updateSocialPost } from "@/lib/social-media/social-media-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function PATCH(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
