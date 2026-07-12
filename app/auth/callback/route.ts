import { NextResponse } from "next/server";
import { acceptTeamInviteForUser } from "@/lib/team/services/team-invite-repository";
import { createClient } from "@/lib/supabase/server";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { normalizeAllowedSkills } from "@/lib/auth/skill-access-shared";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? AUTH_ROUTES.home;

  if (code) {
    const supabase = await createClient();

    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await acceptTeamInviteForUser({
            userId: user.id,
            email: user.email,
          });

          const { data: profile } = await supabase
            .from("profiles")
            .select("allowed_skills")
            .eq("id", user.id)
            .maybeSingle();

          const allowed = normalizeAllowedSkills(
            profile?.allowed_skills as string[] | null | undefined
          );

          if (allowed.length === 0) {
            return NextResponse.redirect(
              `${origin}${AUTH_ROUTES.pendingAccess}`
            );
          }
        }

        const safeNext =
          next.startsWith("/") && !next.startsWith("//")
            ? next
            : AUTH_ROUTES.home;
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
    }
  }

  return NextResponse.redirect(
    `${origin}${AUTH_ROUTES.login}?error=auth_callback`
  );
}
