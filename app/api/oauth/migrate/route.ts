import { NextResponse } from "next/server";
import { readOutlookTokensFromCookies } from "@/features/outlook/services/outlook-auth-server";
import { GOOGLE_OAUTH_SCOPES } from "@/features/gmail/services/google/oauth";
import { OUTLOOK_CONNECT_SCOPES } from "@/features/outlook/types/outlook-types";
import { getSession } from "@/lib/auth/session";
import {
  listOAuthConnectionsForCompany,
  requireOAuthContext,
  upsertOAuthConnection,
} from "@/lib/oauth";
import type { OAuthConnectionPublic } from "@/lib/oauth/types";

export const dynamic = "force-dynamic";

/** Migriert legacy Session-/Cookie-Tokens in oauth_connections. */
async function runOAuthMigration(): Promise<NextResponse> {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const migrated: string[] = [];
  const errors: string[] = [];

  try {
    const { session } = await getSession();
    if (session?.provider_token) {
      const email =
        session.user?.email?.trim().toLowerCase() ??
        auth.context.userEmail?.trim().toLowerCase() ??
        "unknown@gmail.com";

      await upsertOAuthConnection({
        companyId: auth.context.companyId,
        userId: auth.context.userId,
        provider: "google",
        tokens: {
          accessToken: session.provider_token,
          refreshToken: session.provider_refresh_token ?? null,
          accountEmail: email,
          expiresAt: null,
          scopes: [...GOOGLE_OAUTH_SCOPES],
        },
      });
      migrated.push(`google:${email}`);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google-Migration fehlgeschlagen.";
    console.error("[oauth/migrate] google:", message);
    errors.push(message);
  }

  try {
    const cookieTokens = await readOutlookTokensFromCookies();
    if (cookieTokens?.accessToken) {
      const email =
        cookieTokens.accountEmail?.trim().toLowerCase() ?? "unknown@outlook.com";

      await upsertOAuthConnection({
        companyId: auth.context.companyId,
        userId: auth.context.userId,
        provider: "microsoft",
        tokens: {
          accessToken: cookieTokens.accessToken,
          refreshToken: cookieTokens.refreshToken,
          accountEmail: email,
          expiresAt: cookieTokens.expiresAt,
          scopes: [...OUTLOOK_CONNECT_SCOPES],
        },
      });
      migrated.push(`microsoft:${email}`);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Outlook-Migration fehlgeschlagen.";
    console.error("[oauth/migrate] microsoft:", message);
    errors.push(message);
  }

  let connections: OAuthConnectionPublic[] = [];
  try {
    connections = await listOAuthConnectionsForCompany(auth.context.companyId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Verbindungen konnten nicht geladen werden.";
    console.error("[oauth/migrate] list:", message);
    errors.push(message);
  }

  return NextResponse.json({
    ok: errors.length === 0,
    migrated,
    errors,
    connections,
  });
}

export async function POST(): Promise<NextResponse> {
  try {
    return await runOAuthMigration();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth-Migration fehlgeschlagen.";
    console.error("[oauth/migrate]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Legacy-Clients riefen teils GET auf — gleiches Verhalten wie POST. */
export async function GET(): Promise<NextResponse> {
  return POST();
}
