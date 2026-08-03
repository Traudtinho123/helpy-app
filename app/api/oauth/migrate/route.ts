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

type MigrateGoogleBody = {
  accessToken?: string;
  refreshToken?: string | null;
  accountEmail?: string | null;
};

type MigrateRequestBody = {
  google?: MigrateGoogleBody;
};

/** Migriert legacy Session-/Cookie-Tokens in oauth_connections. */
async function runOAuthMigration(
  clientGoogle?: MigrateGoogleBody | null
): Promise<NextResponse> {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const migrated: string[] = [];
  const errors: string[] = [];

  try {
    const { session } = await getSession();
    const accessToken =
      clientGoogle?.accessToken?.trim() || session?.provider_token || null;
    const refreshToken =
      clientGoogle?.refreshToken ?? session?.provider_refresh_token ?? null;
    const email =
      clientGoogle?.accountEmail?.trim().toLowerCase() ??
      session?.user?.email?.trim().toLowerCase() ??
      auth.context.userEmail?.trim().toLowerCase() ??
      "unknown@gmail.com";

    if (accessToken) {
      await upsertOAuthConnection({
        companyId: auth.context.companyId,
        userId: auth.context.userId,
        provider: "google",
        tokens: {
          accessToken,
          refreshToken,
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

export async function POST(request: Request): Promise<NextResponse> {
  let clientGoogle: MigrateGoogleBody | null = null;

  try {
    const body = (await request.json()) as MigrateRequestBody;
    if (body?.google?.accessToken?.trim()) {
      clientGoogle = body.google;
    }
  } catch {
    // Leerer Body ist ok — Server-Session wird versucht.
  }

  try {
    return await runOAuthMigration(clientGoogle);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth-Migration fehlgeschlagen.";
    console.error("[oauth/migrate]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Legacy-Clients riefen teils GET auf — gleiches Verhalten wie POST. */
export async function GET(): Promise<NextResponse> {
  return POST(new Request("http://localhost/api/oauth/migrate", { method: "POST" }));
}
