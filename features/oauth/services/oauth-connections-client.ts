"use client";

import type { OAuthConnectionPublic, OAuthProviderId } from "@/lib/oauth/types";

export type OAuthConnectionsResponse = {
  companyId: string;
  connections: OAuthConnectionPublic[];
  grouped: {
    google: OAuthConnectionPublic[];
    microsoft: OAuthConnectionPublic[];
  };
  counts: {
    google: number;
    microsoft: number;
    total: number;
  };
};

export async function fetchOAuthConnections(
  provider?: OAuthProviderId
): Promise<OAuthConnectionsResponse | null> {
  const query = provider ? `?provider=${provider}` : "";
  const response = await fetch(`/api/oauth/connections${query}`, {
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as OAuthConnectionsResponse;
}

export async function migrateLegacyOAuthTokens(): Promise<void> {
  await fetch("/api/oauth/migrate", { method: "POST" });
}

export function startGoogleMailConnect(): void {
  window.location.href = "/api/oauth/google/start";
}

export function startMicrosoftMailConnect(): void {
  window.location.href = "/api/oauth/microsoft/start";
}

export async function disconnectOAuthConnection(
  connectionId: string
): Promise<boolean> {
  const response = await fetch(`/api/oauth/connections/${connectionId}`, {
    method: "DELETE",
  });
  return response.ok;
}

export type GmailSyncApiResponse = {
  ok: boolean;
  syncedAt?: string;
  accounts: Array<{
    connectionId: string;
    accountEmail: string;
    messages: import("@/features/gmail/services/gmail/types").GmailConnectorMessage[];
  }>;
  error?: string;
};

export async function syncGmailViaOAuthApi(): Promise<GmailSyncApiResponse> {
  const response = await fetch("/api/oauth/gmail/sync", {
    method: "POST",
    cache: "no-store",
  });
  return (await response.json()) as GmailSyncApiResponse;
}
