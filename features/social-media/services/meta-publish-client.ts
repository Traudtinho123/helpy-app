import {
  getSocialConnectionAccessToken,
} from "@/lib/social-media/social-media-repository";
import type { SocialPlatform } from "@/features/social-media/types/social-media-types";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export function isMetaPublishingConfigured(): boolean {
  return Boolean(
    process.env.META_APP_ID?.trim() &&
      (process.env.META_PAGE_ACCESS_TOKEN?.trim() ||
        process.env.META_APP_SECRET?.trim())
  );
}

function resolveMetaEnvToken(): string | null {
  return process.env.META_PAGE_ACCESS_TOKEN?.trim() || null;
}

async function resolveMetaToken(companyId: string): Promise<{
  token: string;
  pageId: string | null;
  instagramId: string | null;
} | null> {
  const fromDb =
    (await getSocialConnectionAccessToken(companyId, "meta")) ??
    (await getSocialConnectionAccessToken(companyId, "facebook"));
  const envToken = resolveMetaEnvToken();

  if (fromDb) {
    return {
      token: fromDb.token,
      pageId: fromDb.connection.pageId,
      instagramId: fromDb.connection.instagramId,
    };
  }

  if (envToken) {
    return {
      token: envToken,
      pageId: process.env.META_FACEBOOK_PAGE_ID?.trim() ?? null,
      instagramId: process.env.META_INSTAGRAM_BUSINESS_ID?.trim() ?? null,
    };
  }

  return null;
}

function buildCaption(text: string, hashtags: string[]): string {
  const tags = hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
  return tags ? `${text.trim()}\n\n${tags}` : text.trim();
}

async function uploadFacebookPhoto(
  pageId: string,
  token: string,
  imageUrl: string
): Promise<string | null> {
  const response = await fetch(`${GRAPH_BASE}/${pageId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: imageUrl,
      published: false,
      access_token: token,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[meta] photo upload failed:", body);
    return null;
  }

  const payload = (await response.json()) as { id?: string };
  return payload.id ?? null;
}

export async function publishToFacebook(input: {
  companyId: string;
  message: string;
  hashtags: string[];
  imageUrl: string | null;
}): Promise<{ postId: string } | { error: string }> {
  const creds = await resolveMetaToken(input.companyId);
  const pageId = creds?.pageId ?? process.env.META_FACEBOOK_PAGE_ID?.trim();

  if (!creds?.token || !pageId) {
    return {
      error:
        "Facebook nicht verbunden — bitte Meta in Einstellungen → Plattformen verbinden.",
    };
  }

  const message = buildCaption(input.message, input.hashtags);

  try {
    if (input.imageUrl?.startsWith("http")) {
      const mediaId = await uploadFacebookPhoto(
        pageId,
        creds.token,
        input.imageUrl
      );
      if (mediaId) {
        const response = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            attached_media: [{ media_fbid: mediaId }],
            access_token: creds.token,
          }),
        });
        if (response.ok) {
          const payload = (await response.json()) as { id?: string };
          if (payload.id) return { postId: payload.id };
        }
      }
    }

    const response = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: creds.token,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { error: `Facebook API-Fehler: ${body.slice(0, 240)}` };
    }

    const payload = (await response.json()) as { id?: string };
    if (!payload.id) return { error: "Facebook API ohne Post-ID." };
    return { postId: payload.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Facebook Verbindungsfehler.",
    };
  }
}

export async function publishToInstagram(input: {
  companyId: string;
  caption: string;
  hashtags: string[];
  imageUrl: string | null;
}): Promise<{ postId: string } | { error: string }> {
  const creds = await resolveMetaToken(input.companyId);
  const igUserId =
    creds?.instagramId ?? process.env.META_INSTAGRAM_BUSINESS_ID?.trim();

  if (!creds?.token || !igUserId) {
    return {
      error:
        "Instagram Business nicht verbunden — Meta OAuth oder META_INSTAGRAM_BUSINESS_ID setzen.",
    };
  }

  if (!input.imageUrl?.startsWith("http")) {
    return {
      error:
        "Instagram benötigt eine öffentliche Bild-URL (HTTPS). Bitte Objektbild in Supabase Storage hochladen.",
    };
  }

  const caption = buildCaption(input.caption, input.hashtags);

  try {
    const createResponse = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: input.imageUrl,
        caption,
        access_token: creds.token,
      }),
    });

    if (!createResponse.ok) {
      const body = await createResponse.text();
      return { error: `Instagram Container-Fehler: ${body.slice(0, 240)}` };
    }

    const created = (await createResponse.json()) as { id?: string };
    if (!created.id) return { error: "Instagram Container ohne ID." };

    const publishResponse = await fetch(
      `${GRAPH_BASE}/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: created.id,
          access_token: creds.token,
        }),
      }
    );

    if (!publishResponse.ok) {
      const body = await publishResponse.text();
      return { error: `Instagram Publish-Fehler: ${body.slice(0, 240)}` };
    }

    const published = (await publishResponse.json()) as { id?: string };
    if (!published.id) return { error: "Instagram Publish ohne Post-ID." };
    return { postId: published.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Instagram Verbindungsfehler.",
    };
  }
}

export async function publishSocialPost(input: {
  companyId: string;
  platform: SocialPlatform;
  message: string;
  hashtags: string[];
  imageUrl: string | null;
}): Promise<{ postId: string } | { error: string }> {
  if (input.platform === "facebook") {
    return publishToFacebook(input);
  }
  if (input.platform === "instagram") {
    return publishToInstagram({
      companyId: input.companyId,
      caption: input.message,
      hashtags: input.hashtags,
      imageUrl: input.imageUrl,
    });
  }
  return { error: "LinkedIn wird separat veröffentlicht." };
}
