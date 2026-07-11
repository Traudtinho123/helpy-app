import { createClient } from "@/lib/supabase/server";
import type { Session, User } from "@supabase/supabase-js";

export type AuthSessionResult = {
  session: Session | null;
  user: User | null;
};

export async function getSession(): Promise<AuthSessionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { session: null, user: null };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    session,
    user: session?.user ?? null,
  };
}

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  const { session } = await getSession();
  return session !== null;
}
