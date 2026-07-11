import { cookies } from "next/headers";
import type { OAuthStartState } from "@/lib/oauth/types";

export const OAUTH_STATE_COOKIE = "helpy_oauth_state_v1";

export async function storeOAuthStartState(state: OAuthStartState): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export async function consumeOAuthStartState(
  stateParam: string
): Promise<OAuthStartState | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OAuthStartState;
    if (parsed.state !== stateParam) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildOAuthReturnUrl(
  origin: string,
  provider: "google" | "microsoft",
  result: "connected" | "error",
  message?: string
): string {
  const params = new URLSearchParams({ oauth: result, provider });
  if (message) params.set("message", message);
  return `${origin}/plattformen?${params.toString()}`;
}
