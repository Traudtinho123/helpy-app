const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export function isMetaOAuthConfigured(): boolean {
  return Boolean(
    process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim()
  );
}

export function buildMetaOAuthStartUrl(state: string): string {
  const appId = process.env.META_APP_ID!.trim();
  const redirectUri = resolveMetaRedirectUri();
  const scopes = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_content_publish",
    "business_management",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: scopes,
    response_type: "code",
  });

  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export function resolveMetaRedirectUri(): string {
  const base =
    process.env.META_OAUTH_REDIRECT_URI?.trim() ??
    `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"}/api/oauth/meta/callback`;
  return base;
}

export async function exchangeMetaAuthCode(code: string): Promise<{
  accessToken: string;
  expiresIn?: number;
} | null> {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: resolveMetaRedirectUri(),
    code,
  });

  const response = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) return null;
  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in,
  };
}

export async function fetchMetaPages(userToken: string): Promise<
  Array<{
    id: string;
    name: string;
    accessToken: string;
    instagramId: string | null;
  }>
> {
  const response = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userToken)}`
  );
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    data?: Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id?: string };
    }>;
  };

  return (payload.data ?? []).map((page) => ({
    id: page.id,
    name: page.name,
    accessToken: page.access_token,
    instagramId: page.instagram_business_account?.id ?? null,
  }));
}

export async function exchangeMetaLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn?: number } | null> {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!payload.access_token) return null;

  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in,
  };
}
