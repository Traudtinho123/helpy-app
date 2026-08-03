"use client";

import { createClient } from "@/lib/supabase/client";
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
  try {
    const supabase = createClient();
    let body: {
      google?: {
        accessToken: string;
        refreshToken: string | null;
        accountEmail: string | null;
      };
    } = {};

    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.provider_token) {
        body = {
          google: {
            accessToken: session.provider_token,
            refreshToken: session.provider_refresh_token ?? null,
            accountEmail: session.user?.email ?? null,
          },
        };
      }
    }

    const response = await fetch("/api/oauth/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.warn("[oauth] migrate failed:", response.status);
    }
  } catch (error) {
    console.warn(
      "[oauth] migrate failed:",
      error instanceof Error ? error.message : error
    );
  }
}

export function startGoogleMailConnect(returnTo = "/plattformen"): void {
  window.location.href = `/api/oauth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
}

export function startMicrosoftMailConnect(returnTo = "/plattformen"): void {
  window.location.href = `/api/oauth/microsoft/start?returnTo=${encodeURIComponent(returnTo)}`;
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

  const raw = await response.text();
  try {
    return JSON.parse(raw) as GmailSyncApiResponse;
  } catch {
    return {
      ok: false,
      accounts: [],
      error: response.ok
        ? "Ungültige Server-Antwort beim Gmail-Sync."
        : `Gmail-Sync fehlgeschlagen (${response.status}).`,
    };
  }
}
