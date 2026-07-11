/** Microsoft Graph / Outlook — gemeinsame Typen. */
export type MicrosoftGraphTokens = {
  accessToken?: string;
  refreshToken?: string;
};

export type OutlookOAuthConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  tenantId: string;
  scopes: string[];
};

export const OUTLOOK_MAIL_SCOPES = [
  "Mail.Read",
  "Mail.Send",
  "offline_access",
] as const;

export const OUTLOOK_CALENDAR_SCOPES = [
  "Calendars.Read",
  "Calendars.ReadWrite",
  "offline_access",
] as const;

export const MICROSOFT_365_SCOPES = [
  "Mail.Read",
  "Mail.Send",
  "Calendars.Read",
  "Calendars.ReadWrite",
  "Contacts.Read",
  "User.Read",
  "offline_access",
] as const;

export function getMicrosoftOAuthConfig(): OutlookOAuthConfig {
  return {
    clientId: process.env.MICROSOFT_CLIENT_ID ?? "",
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    redirectUri:
      process.env.MICROSOFT_REDIRECT_URI ??
      "http://localhost:3000/api/integrations/microsoft/callback",
    tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
    scopes: [...MICROSOFT_365_SCOPES],
  };
}

export function isMicrosoftConfigured(): boolean {
  return Boolean(process.env.MICROSOFT_CLIENT_ID);
}

export function buildMicrosoftAuthUrl(config: OutlookOAuthConfig): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    response_mode: "query",
  });
  return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export type GraphMessageRef = {
  id: string;
  subject: string;
  receivedDateTime: string;
};

export type GraphEventRef = {
  id: string;
  subject: string;
  start: { dateTime: string };
  end: { dateTime: string };
};

export type GraphContactRef = {
  id: string;
  displayName: string;
  emailAddresses?: Array<{ address: string }>;
};
