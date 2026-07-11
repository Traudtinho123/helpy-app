import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { decryptOAuthSecret, encryptOAuthSecret } from "@/lib/oauth/token-crypto";
import type {
  OAuthConnectionPublic,
  OAuthConnectionStatus,
  OAuthProviderId,
  OAuthStoredTokens,
} from "@/lib/oauth/types";

type OAuthConnectionRow = {
  id: string;
  company_id: string;
  connected_by_user_id: string;
  provider: OAuthProviderId;
  account_email: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  scopes: string[];
  status: OAuthConnectionStatus;
  last_sync_at: string | null;
  last_error: string | null;
  connected_at: string;
  updated_at: string;
};

/** In-Memory-Fallback für lokale Entwicklung ohne service role. */
const devConnections = new Map<string, OAuthConnectionRow>();

function rowToPublic(row: OAuthConnectionRow): OAuthConnectionPublic {
  return {
    id: row.id,
    companyId: row.company_id,
    provider: row.provider,
    accountEmail: row.account_email,
    status: row.status,
    connectedAt: row.connected_at,
    lastSyncAt: row.last_sync_at,
    lastError: row.last_error,
    connectedByUserId: row.connected_by_user_id,
  };
}

function generateDevId(): string {
  return `dev-oauth-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listOAuthConnectionsForCompany(
  companyId: string,
  provider?: OAuthProviderId
): Promise<OAuthConnectionPublic[]> {
  if (!isSupabaseAdminConfigured()) {
    return [...devConnections.values()]
      .filter((row) => row.company_id === companyId)
      .filter((row) => !provider || row.provider === provider)
      .map(rowToPublic)
      .sort((a, b) => b.connectedAt.localeCompare(a.connectedAt));
  }

  const admin = createAdminClient();
  if (!admin) return [];

  let query = admin
    .from("oauth_connections")
    .select(
      "id, company_id, connected_by_user_id, provider, account_email, status, connected_at, last_sync_at, last_error"
    )
    .eq("company_id", companyId)
    .neq("status", "revoked")
    .order("connected_at", { ascending: false });

  if (provider) {
    query = query.eq("provider", provider);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[oauth] list connections failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    companyId: row.company_id,
    provider: row.provider as OAuthProviderId,
    accountEmail: row.account_email,
    status: row.status as OAuthConnectionStatus,
    connectedAt: row.connected_at,
    lastSyncAt: row.last_sync_at,
    lastError: row.last_error,
    connectedByUserId: row.connected_by_user_id,
  }));
}

export async function upsertOAuthConnection(input: {
  companyId: string;
  userId: string;
  provider: OAuthProviderId;
  tokens: OAuthStoredTokens;
}): Promise<OAuthConnectionPublic> {
  const accountEmail = input.tokens.accountEmail.trim().toLowerCase();
  const accessEncrypted = encryptOAuthSecret(input.tokens.accessToken);
  const refreshEncrypted = input.tokens.refreshToken
    ? encryptOAuthSecret(input.tokens.refreshToken)
    : null;
  const expiresAt = input.tokens.expiresAt
    ? new Date(input.tokens.expiresAt).toISOString()
    : null;

  if (!isSupabaseAdminConfigured()) {
    const existing = [...devConnections.values()].find(
      (row) =>
        row.company_id === input.companyId &&
        row.provider === input.provider &&
        row.account_email === accountEmail
    );

    const row: OAuthConnectionRow = {
      id: existing?.id ?? generateDevId(),
      company_id: input.companyId,
      connected_by_user_id: input.userId,
      provider: input.provider,
      account_email: accountEmail,
      access_token_encrypted: accessEncrypted,
      refresh_token_encrypted: refreshEncrypted,
      token_expires_at: expiresAt,
      scopes: input.tokens.scopes,
      status: "active",
      last_sync_at: existing?.last_sync_at ?? null,
      last_error: null,
      connected_at: existing?.connected_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    devConnections.set(row.id, row);
    return rowToPublic(row);
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("OAuth-Speicher nicht verfügbar.");
  }

  const { data, error } = await admin
    .from("oauth_connections")
    .upsert(
      {
        company_id: input.companyId,
        connected_by_user_id: input.userId,
        provider: input.provider,
        account_email: accountEmail,
        access_token_encrypted: accessEncrypted,
        refresh_token_encrypted: refreshEncrypted,
        token_expires_at: expiresAt,
        scopes: input.tokens.scopes,
        status: "active",
        last_error: null,
      },
      { onConflict: "company_id,provider,account_email" }
    )
    .select(
      "id, company_id, connected_by_user_id, provider, account_email, status, connected_at, last_sync_at, last_error"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "OAuth-Verbindung konnte nicht gespeichert werden.");
  }

  return {
    id: data.id,
    companyId: data.company_id,
    provider: data.provider as OAuthProviderId,
    accountEmail: data.account_email,
    status: data.status as OAuthConnectionStatus,
    connectedAt: data.connected_at,
    lastSyncAt: data.last_sync_at,
    lastError: data.last_error,
    connectedByUserId: data.connected_by_user_id,
  };
}

export async function getOAuthConnectionTokens(
  connectionId: string,
  companyId: string
): Promise<OAuthStoredTokens | null> {
  if (!isSupabaseAdminConfigured()) {
    const row = devConnections.get(connectionId);
    if (!row || row.company_id !== companyId || row.status === "revoked") {
      return null;
    }
    return decryptRowTokens(row);
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("oauth_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("company_id", companyId)
    .neq("status", "revoked")
    .maybeSingle();

  if (error || !data) return null;
  return decryptRowTokens(data as OAuthConnectionRow);
}

export async function getOAuthConnectionsWithTokens(
  companyId: string,
  provider: OAuthProviderId
): Promise<Array<{ connection: OAuthConnectionPublic; tokens: OAuthStoredTokens }>> {
  const connections = await listOAuthConnectionsForCompany(companyId, provider);
  const resolved: Array<{ connection: OAuthConnectionPublic; tokens: OAuthStoredTokens }> = [];

  for (const connection of connections) {
    const tokens = await getOAuthConnectionTokens(connection.id, companyId);
    if (tokens) {
      resolved.push({ connection, tokens });
    }
  }

  return resolved;
}

function decryptRowTokens(row: OAuthConnectionRow): OAuthStoredTokens {
  return {
    accessToken: decryptOAuthSecret(row.access_token_encrypted),
    refreshToken: row.refresh_token_encrypted
      ? decryptOAuthSecret(row.refresh_token_encrypted)
      : null,
    accountEmail: row.account_email,
    expiresAt: row.token_expires_at
      ? Date.parse(row.token_expires_at)
      : null,
    scopes: row.scopes ?? [],
  };
}

export async function updateOAuthConnectionTokens(
  connectionId: string,
  companyId: string,
  tokens: OAuthStoredTokens
): Promise<void> {
  const accessEncrypted = encryptOAuthSecret(tokens.accessToken);
  const refreshEncrypted = tokens.refreshToken
    ? encryptOAuthSecret(tokens.refreshToken)
    : null;
  const expiresAt = tokens.expiresAt
    ? new Date(tokens.expiresAt).toISOString()
    : null;

  if (!isSupabaseAdminConfigured()) {
    const row = devConnections.get(connectionId);
    if (!row || row.company_id !== companyId) return;
    devConnections.set(connectionId, {
      ...row,
      access_token_encrypted: accessEncrypted,
      refresh_token_encrypted: refreshEncrypted,
      token_expires_at: expiresAt,
      status: "active",
      last_error: null,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("oauth_connections")
    .update({
      access_token_encrypted: accessEncrypted,
      refresh_token_encrypted: refreshEncrypted,
      token_expires_at: expiresAt,
      status: "active",
      last_error: null,
    })
    .eq("id", connectionId)
    .eq("company_id", companyId);
}

export async function updateOAuthConnectionSyncMeta(
  connectionId: string,
  companyId: string,
  meta: { lastSyncAt?: string; lastError?: string | null; status?: OAuthConnectionStatus }
): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    const row = devConnections.get(connectionId);
    if (!row || row.company_id !== companyId) return;
    devConnections.set(connectionId, {
      ...row,
      last_sync_at: meta.lastSyncAt ?? row.last_sync_at,
      last_error: meta.lastError ?? row.last_error,
      status: meta.status ?? row.status,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("oauth_connections")
    .update({
      last_sync_at: meta.lastSyncAt,
      last_error: meta.lastError,
      status: meta.status,
    })
    .eq("id", connectionId)
    .eq("company_id", companyId);
}

export async function revokeOAuthConnection(
  connectionId: string,
  companyId: string
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    const row = devConnections.get(connectionId);
    if (!row || row.company_id !== companyId) return false;
    devConnections.set(connectionId, { ...row, status: "revoked" });
    return true;
  }

  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin
    .from("oauth_connections")
    .update({ status: "revoked" })
    .eq("id", connectionId)
    .eq("company_id", companyId);

  return !error;
}

/** Nur für Tests. */
export function clearDevOAuthConnectionsForTests(): void {
  devConnections.clear();
}
