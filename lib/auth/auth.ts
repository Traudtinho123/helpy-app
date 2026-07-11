import { createClient, resetBrowserClient } from "@/lib/supabase/client";
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import {
  getAuthCallbackUrl,
  getPostLoginRedirectUrl,
} from "@/lib/auth/routes";
import { getGoogleOAuthScopeString } from "@/features/gmail/services/google/oauth";
import type { AuthError } from "@supabase/supabase-js";

export type AuthActionResult = {
  error: AuthError | { message: string } | null;
};

function getOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function notConfiguredResult(): AuthActionResult {
  return {
    error: { message: SUPABASE_NOT_CONFIGURED_MESSAGE },
  };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthActionResult> {
  const supabase = createClient();
  if (!supabase) return notConfiguredResult();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { error };
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthActionResult> {
  const supabase = createClient();
  if (!supabase) return notConfiguredResult();

  const origin = getOrigin();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getPostLoginRedirectUrl(origin),
    },
  });

  return { error };
}

export async function signInWithGoogle(): Promise<AuthActionResult> {
  const supabase = createClient();
  if (!supabase) return notConfiguredResult();

  const origin = getOrigin();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(origin),
      scopes: getGoogleOAuthScopeString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  return { error };
}

export async function signOut(): Promise<AuthActionResult> {
  const supabase = createClient();
  if (!supabase) return notConfiguredResult();

  const { error } = await supabase.auth.signOut();
  resetBrowserClient();
  return { error };
}
