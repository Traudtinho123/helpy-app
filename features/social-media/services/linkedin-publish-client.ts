import { getSocialConnectionAccessToken } from "@/lib/social-media/social-media-repository";

export function isLinkedInPublishingConfigured(): boolean {
  return Boolean(
    process.env.LINKEDIN_ACCESS_TOKEN?.trim() &&
      process.env.LINKEDIN_ORGANIZATION_ID?.trim()
  );
}

async function resolveLinkedInAuth(companyId: string): Promise<{
  token: string;
  organizationId: string;
} | null> {
  const fromDb = await getSocialConnectionAccessToken(companyId, "linkedin");
  const envToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const envOrg = process.env.LINKEDIN_ORGANIZATION_ID?.trim();

  if (fromDb?.connection.linkedinOrgId) {
    return {
      token: fromDb.token,
      organizationId: fromDb.connection.linkedinOrgId,
    };
  }

  if (envToken && envOrg) {
    return { token: envToken, organizationId: envOrg };
  }

  return null;
}

export async function publishToLinkedIn(input: {
  companyId: string;
  message: string;
  hashtags: string[];
  imageUrl: string | null;
  title: string;
}): Promise<{ postId: string } | { error: string }> {
  const auth = await resolveLinkedInAuth(input.companyId);
  if (!auth) {
    return {
      error:
        "LinkedIn nicht verbunden — bitte in Einstellungen → Plattformen verbinden.",
    };
  }

  const tags = input.hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
  const text = tags ? `${input.message.trim()}\n\n${tags}` : input.message.trim();

  const body: Record<string, unknown> = {
    author: `urn:li:organization:${auth.organizationId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: input.imageUrl?.startsWith("http") ? "IMAGE" : "NONE",
        ...(input.imageUrl?.startsWith("http")
          ? {
              media: [
                {
                  status: "READY",
                  description: { text: input.title },
                  originalUrl: input.imageUrl,
                  title: { text: input.title },
                },
              ],
            }
          : {}),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  try {
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { error: `LinkedIn API-Fehler: ${errBody.slice(0, 240)}` };
    }

    const payload = (await response.json()) as { id?: string };
    if (!payload.id) return { error: "LinkedIn API ohne Post-ID." };
    return { postId: payload.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "LinkedIn Verbindungsfehler.",
    };
  }
}
