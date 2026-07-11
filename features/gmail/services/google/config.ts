import type { ConnectOptions } from "@/features/platforms/services/integrations/types";

export type GoogleConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
};

export function getGoogleConfig(): GoogleConfig {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      "http://localhost:3000/api/integrations/google/callback",
  };
}

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID);
}

export type GoogleOAuthConfig = GoogleConfig & {
  scopes: string[];
};

export function getGoogleOAuthConfig(
  options?: ConnectOptions
): GoogleOAuthConfig {
  const config = getGoogleConfig();
  return {
    ...config,
    redirectUri: options?.redirectUri ?? config.redirectUri,
    scopes: options?.scopes ?? [],
  };
}
