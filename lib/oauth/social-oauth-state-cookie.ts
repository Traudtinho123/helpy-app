import { cookies } from "next/headers";

export type SocialOAuthProvider = "meta" | "linkedin";

export type SocialOAuthStartState = {
  state: string;
  provider: SocialOAuthProvider;
  companyId: string;
  userId: string;
  returnTo: string;
};

export const SOCIAL_OAUTH_STATE_COOKIE = "helpy_social_oauth_state_v1";

export async function storeSocialOAuthStartState(
  state: SocialOAuthStartState
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SOCIAL_OAUTH_STATE_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export async function consumeSocialOAuthStartState(
  stateParam: string
): Promise<SocialOAuthStartState | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SOCIAL_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(SOCIAL_OAUTH_STATE_COOKIE);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SocialOAuthStartState;
    if (parsed.state !== stateParam) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildSocialOAuthReturnUrl(
  origin: string,
  provider: SocialOAuthProvider,
  result: "connected" | "error",
  message?: string,
  returnTo = "/plattformen"
): string {
  const params = new URLSearchParams({
    social_oauth: result,
    social_provider: provider,
  });
  if (message) params.set("message", message);
  const base = returnTo.startsWith("http") ? returnTo : `${origin}${returnTo}`;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${params.toString()}`;
}
