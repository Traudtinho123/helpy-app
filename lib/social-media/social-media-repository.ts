import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { decryptOAuthSecret, encryptOAuthSecret } from "@/lib/oauth/token-crypto";
import type {
  SocialConnection,
  SocialConnectionPlatform,
  SocialPost,
  SocialPostEngagement,
  SocialPostStatus,
  SocialPlatform,
} from "@/features/social-media/types/social-media-types";

type SocialPostRow = {
  id: string;
  company_id: string;
  objekt_id: string;
  platform: SocialPlatform;
  text_content: string | null;
  hashtags: string[] | null;
  image_url: string | null;
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  platform_post_id: string | null;
  engagement: SocialPostEngagement | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type SocialConnectionRow = {
  id: string;
  company_id: string;
  platform: SocialConnectionPlatform;
  access_token_encrypted: string | null;
  token_expires_at: string | null;
  page_id: string | null;
  page_name: string | null;
  instagram_id: string | null;
  linkedin_org_id: string | null;
  connected_at: string;
  updated_at: string;
};

const devPosts = new Map<string, SocialPostRow>();
const devConnections = new Map<string, SocialConnectionRow>();

function devPostKey(companyId: string, id: string): string {
  return `${companyId}:${id}`;
}

function devConnectionKey(companyId: string, platform: string): string {
  return `${companyId}:${platform}`;
}

function rowToPost(row: SocialPostRow): SocialPost {
  return {
    id: row.id,
    companyId: row.company_id,
    objektId: row.objekt_id,
    platform: row.platform,
    textContent: row.text_content,
    hashtags: row.hashtags ?? [],
    imageUrl: row.image_url,
    status: row.status,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    platformPostId: row.platform_post_id,
    engagement: row.engagement ?? {},
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToConnection(row: SocialConnectionRow): SocialConnection {
  return {
    id: row.id,
    companyId: row.company_id,
    platform: row.platform,
    pageId: row.page_id,
    pageName: row.page_name,
    instagramId: row.instagram_id,
    linkedinOrgId: row.linkedin_org_id,
    tokenExpiresAt: row.token_expires_at,
    connectedAt: row.connected_at,
    updatedAt: row.updated_at,
    connected: Boolean(row.access_token_encrypted),
  };
}

export async function listSocialPostsForObjekt(
  companyId: string,
  objektId: string
): Promise<SocialPost[]> {
  if (!isSupabaseAdminConfigured()) {
    return [...devPosts.values()]
      .filter((row) => row.company_id === companyId && row.objekt_id === objektId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(rowToPost);
  }

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("social_posts")
    .select("*")
    .eq("company_id", companyId)
    .eq("objekt_id", objektId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[social-posts] list failed:", error.message);
    return [];
  }

  return (data as SocialPostRow[]).map(rowToPost);
}

export async function listRecentSocialPosts(
  companyId: string,
  limit = 50
): Promise<SocialPost[]> {
  if (!isSupabaseAdminConfigured()) {
    return [...devPosts.values()]
      .filter((row) => row.company_id === companyId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
      .map(rowToPost);
  }

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("social_posts")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[social-posts] list recent failed:", error.message);
    return [];
  }

  return (data as SocialPostRow[]).map(rowToPost);
}

export async function getSocialPostById(
  companyId: string,
  postId: string
): Promise<SocialPost | null> {
  if (!isSupabaseAdminConfigured()) {
    const row = devPosts.get(devPostKey(companyId, postId));
    return row ? rowToPost(row) : null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("social_posts")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", postId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToPost(data as SocialPostRow);
}

export async function upsertSocialPosts(
  companyId: string,
  posts: Array<{
    objektId: string;
    platform: SocialPlatform;
    textContent: string;
    hashtags: string[];
    imageUrl: string | null;
    status?: SocialPostStatus;
  }>
): Promise<SocialPost[]> {
  const now = new Date().toISOString();
  const saved: SocialPost[] = [];

  for (const post of posts) {
    const existing = (await listSocialPostsForObjekt(companyId, post.objektId)).find(
      (item) => item.platform === post.platform && item.status !== "published"
    );

    const row: SocialPostRow = {
      id: existing?.id ?? crypto.randomUUID(),
      company_id: companyId,
      objekt_id: post.objektId,
      platform: post.platform,
      text_content: post.textContent,
      hashtags: post.hashtags,
      image_url: post.imageUrl,
      status: post.status ?? existing?.status ?? "draft",
      scheduled_at: existing?.scheduledAt ?? null,
      published_at: existing?.publishedAt ?? null,
      platform_post_id: existing?.platformPostId ?? null,
      engagement: existing?.engagement ?? {},
      error_message: null,
      created_at: existing?.createdAt ?? now,
      updated_at: now,
    };

    if (!isSupabaseAdminConfigured()) {
      devPosts.set(devPostKey(companyId, row.id), row);
      saved.push(rowToPost(row));
      continue;
    }

    const admin = createAdminClient();
    if (!admin) continue;

    const { data, error } = await admin
      .from("social_posts")
      .upsert(row as never, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      console.error("[social-posts] upsert failed:", error.message);
      continue;
    }

    saved.push(rowToPost(data as SocialPostRow));
  }

  return saved;
}

export async function updateSocialPost(
  companyId: string,
  postId: string,
  patch: Partial<{
    textContent: string;
    hashtags: string[];
    imageUrl: string | null;
    status: SocialPostStatus;
    scheduledAt: string | null;
    publishedAt: string | null;
    platformPostId: string | null;
    engagement: SocialPostEngagement;
    errorMessage: string | null;
  }>
): Promise<SocialPost | null> {
  const existing = await getSocialPostById(companyId, postId);
  if (!existing) return null;

  const row: SocialPostRow = {
    id: existing.id,
    company_id: companyId,
    objekt_id: existing.objektId,
    platform: existing.platform,
    text_content: patch.textContent ?? existing.textContent,
    hashtags: patch.hashtags ?? existing.hashtags,
    image_url: patch.imageUrl !== undefined ? patch.imageUrl : existing.imageUrl,
    status: patch.status ?? existing.status,
    scheduled_at:
      patch.scheduledAt !== undefined ? patch.scheduledAt : existing.scheduledAt,
    published_at:
      patch.publishedAt !== undefined ? patch.publishedAt : existing.publishedAt,
    platform_post_id:
      patch.platformPostId !== undefined
        ? patch.platformPostId
        : existing.platformPostId,
    engagement: patch.engagement ?? existing.engagement,
    error_message:
      patch.errorMessage !== undefined ? patch.errorMessage : existing.errorMessage,
    created_at: existing.createdAt,
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseAdminConfigured()) {
    devPosts.set(devPostKey(companyId, row.id), row);
    return rowToPost(row);
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("social_posts")
    .update(row as never)
    .eq("company_id", companyId)
    .eq("id", postId)
    .select("*")
    .single();

  if (error) {
    console.error("[social-posts] update failed:", error.message);
    return null;
  }

  return rowToPost(data as SocialPostRow);
}

export async function listSocialConnections(
  companyId: string
): Promise<SocialConnection[]> {
  if (!isSupabaseAdminConfigured()) {
    return [...devConnections.values()]
      .filter((row) => row.company_id === companyId)
      .map(rowToConnection);
  }

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("social_connections")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    console.error("[social-connections] list failed:", error.message);
    return [];
  }

  return (data as SocialConnectionRow[]).map(rowToConnection);
}

export async function getSocialConnectionAccessToken(
  companyId: string,
  platform: SocialConnectionPlatform
): Promise<{ token: string; connection: SocialConnection } | null> {
  if (!isSupabaseAdminConfigured()) {
    const row = devConnections.get(devConnectionKey(companyId, platform));
    if (!row?.access_token_encrypted) return null;
    return {
      token: decryptOAuthSecret(row.access_token_encrypted),
      connection: rowToConnection(row),
    };
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("social_connections")
    .select("*")
    .eq("company_id", companyId)
    .eq("platform", platform)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as SocialConnectionRow;
  if (!row.access_token_encrypted) return null;

  return {
    token: decryptOAuthSecret(row.access_token_encrypted),
    connection: rowToConnection(row),
  };
}

export async function upsertSocialConnection(input: {
  companyId: string;
  platform: SocialConnectionPlatform;
  accessToken: string;
  tokenExpiresAt?: string | null;
  pageId?: string | null;
  pageName?: string | null;
  instagramId?: string | null;
  linkedinOrgId?: string | null;
}): Promise<SocialConnection | null> {
  const now = new Date().toISOString();
  const encrypted = encryptOAuthSecret(input.accessToken);

  const existingConnections = await listSocialConnections(input.companyId);
  const existing = existingConnections.find((item) => item.platform === input.platform);

  const row: SocialConnectionRow = {
    id: existing?.id ?? crypto.randomUUID(),
    company_id: input.companyId,
    platform: input.platform,
    access_token_encrypted: encrypted,
    token_expires_at: input.tokenExpiresAt ?? null,
    page_id: input.pageId ?? null,
    page_name: input.pageName ?? null,
    instagram_id: input.instagramId ?? null,
    linkedin_org_id: input.linkedinOrgId ?? null,
    connected_at: existing?.connectedAt ?? now,
    updated_at: now,
  };

  if (!isSupabaseAdminConfigured()) {
    devConnections.set(devConnectionKey(input.companyId, input.platform), row);
    return rowToConnection(row);
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("social_connections")
    .upsert(row as never, { onConflict: "company_id,platform" })
    .select("*")
    .single();

  if (error) {
    console.error("[social-connections] upsert failed:", error.message);
    return null;
  }

  return rowToConnection(data as SocialConnectionRow);
}

export async function revokeSocialConnection(
  companyId: string,
  platform: SocialConnectionPlatform
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    devConnections.delete(devConnectionKey(companyId, platform));
    return true;
  }

  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin
    .from("social_connections")
    .delete()
    .eq("company_id", companyId)
    .eq("platform", platform);

  return !error;
}
