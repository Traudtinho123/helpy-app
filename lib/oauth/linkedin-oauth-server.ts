export function isLinkedInOAuthConfigured(): boolean {
  return Boolean(
    process.env.LINKEDIN_CLIENT_ID?.trim() &&
      process.env.LINKEDIN_CLIENT_SECRET?.trim()
  );
}

export function resolveLinkedInRedirectUri(): string {
  return (
    process.env.LINKEDIN_OAUTH_REDIRECT_URI?.trim() ??
    `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"}/api/oauth/linkedin/callback`
  );
}

export function buildLinkedInOAuthStartUrl(state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID!.trim();
  const redirectUri = resolveLinkedInRedirectUri();
  const scopes = ["w_organization_social", "r_organization_social", "openid", "profile", "email"];

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: scopes.join(" "),
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedInAuthCode(code: string): Promise<{
  accessToken: string;
  expiresIn?: number;
} | null> {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: resolveLinkedInRedirectUri(),
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

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

export async function fetchLinkedInOrganizations(accessToken: string): Promise<
  Array<{ id: string; name: string }>
> {
  const response = await fetch(
    "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  if (!response.ok) return [];

  const payload = (await response.json()) as {
    elements?: Array<{ organization?: string }>;
  };

  const orgs: Array<{ id: string; name: string }> = [];
  for (const element of payload.elements ?? []) {
    const urn = element.organization;
    if (!urn) continue;
    const id = urn.replace("urn:li:organization:", "");
    orgs.push({ id, name: `Organisation ${id}` });
  }

  return orgs;
}
