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

/** Migriert legacy Session-/Cookie-Tokens in oauth_connections. */
export async function POST(): Promise<NextResponse> {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const migrated: string[] = [];

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

  const connections = await listOAuthConnectionsForCompany(auth.context.companyId);

  return NextResponse.json({
    ok: true,
    migrated,
    connections,
  });
}
