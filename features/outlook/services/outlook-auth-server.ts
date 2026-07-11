import { cookies } from "next/headers";
import { isMicrosoftConfigured } from "@/features/calendar/services/microsoft/types";
import { OUTLOOK_CONNECT_SCOPES } from "@/features/outlook/types/outlook-types";
import {
  getValidOutlookTokensForCompany,
  upsertOAuthConnection,
} from "@/lib/oauth";
import { requireOAuthContext } from "@/lib/oauth/require-oauth-context";
import {
  buildMicrosoftOAuthStartUrl,
  exchangeMicrosoftAuthCode,
  getMicrosoftOAuthRedirectUri,
  refreshMicrosoftAccessToken,
} from "@/lib/oauth/microsoft-oauth-server";

const ACCESS_COOKIE = "helpy_outlook_access";
export const OUTLOOK_OAUTH_STATE_COOKIE = "helpy_outlook_oauth_state";
const REFRESH_COOKIE = "helpy_outlook_refresh";
const EMAIL_COOKIE = "helpy_outlook_email";
const EXPIRES_COOKIE = "helpy_outlook_expires";

export type OutlookStoredTokens = {
  accessToken: string;
  refreshToken: string | null;
  accountEmail: string | null;
  expiresAt: number | null;
};

export function isOutlookOAuthConfigured(): boolean {
  return isMicrosoftConfigured();
}

export function buildOutlookAuthStartUrl(state: string): string {
  return buildMicrosoftOAuthStartUrl(state);
}

function getOutlookRedirectUri(): string {
  return getMicrosoftOAuthRedirectUri();
}

export async function exchangeOutlookAuthCode(
  code: string
): Promise<OutlookStoredTokens> {
  const tokens = await exchangeMicrosoftAuthCode(code);
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accountEmail: tokens.accountEmail,
    expiresAt: tokens.expiresAt,
  };
}

export async function refreshOutlookAccessToken(
  refreshToken: string,
  accountEmail?: string | null
): Promise<OutlookStoredTokens> {
  const tokens = await refreshMicrosoftAccessToken(
    refreshToken,
    accountEmail ?? "unknown@outlook.com"
  );
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accountEmail: tokens.accountEmail,
    expiresAt: tokens.expiresAt,
  };
}

export async function storeOutlookTokensInCookies(
  tokens: OutlookStoredTokens
): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  if (tokens.refreshToken) {
    cookieStore.set(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  if (tokens.accountEmail) {
    cookieStore.set(EMAIL_COOKIE, tokens.accountEmail, {
      httpOnly: false,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  if (tokens.expiresAt) {
    cookieStore.set(EXPIRES_COOKIE, String(tokens.expiresAt), {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  const auth = await requireOAuthContext();
  if (auth.ok && tokens.accountEmail) {
    await upsertOAuthConnection({
      companyId: auth.context.companyId,
      userId: auth.context.userId,
      provider: "microsoft",
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accountEmail: tokens.accountEmail,
        expiresAt: tokens.expiresAt,
        scopes: [...OUTLOOK_CONNECT_SCOPES],
      },
    });
  }
}

export async function readOutlookTokensFromCookies(): Promise<OutlookStoredTokens | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: cookieStore.get(REFRESH_COOKIE)?.value ?? null,
    accountEmail: cookieStore.get(EMAIL_COOKIE)?.value ?? null,
    expiresAt: cookieStore.get(EXPIRES_COOKIE)?.value
      ? Number(cookieStore.get(EXPIRES_COOKIE)?.value)
      : null,
  };
}

export async function clearOutlookTokensFromCookies(): Promise<void> {
  const cookieStore = await cookies();
  for (const name of [
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    EMAIL_COOKIE,
    EXPIRES_COOKIE,
  ]) {
    cookieStore.delete(name);
  }
}

export async function getValidOutlookAccessToken(): Promise<OutlookStoredTokens | null> {
  const auth = await requireOAuthContext();
  if (auth.ok) {
    const fromDb = await getValidOutlookTokensForCompany(auth.context.companyId);
    if (fromDb?.tokens) {
      return {
        accessToken: fromDb.tokens.accessToken,
        refreshToken: fromDb.tokens.refreshToken,
        accountEmail: fromDb.tokens.accountEmail,
        expiresAt: fromDb.tokens.expiresAt,
      };
    }
  }

  const tokens = await readOutlookTokensFromCookies();
  if (!tokens) return null;

  const expiresSoon =
    tokens.expiresAt != null && tokens.expiresAt - Date.now() < 60_000;

  if (!expiresSoon) {
    return tokens;
  }

  if (!tokens.refreshToken) {
    return tokens;
  }

  const refreshed = await refreshOutlookAccessToken(
    tokens.refreshToken,
    tokens.accountEmail
  );
  await storeOutlookTokensInCookies(refreshed);
  return refreshed;
}
