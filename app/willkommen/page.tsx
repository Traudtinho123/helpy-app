import Link from "next/link";
import { redirect } from "next/navigation";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { getSkillAccessForCurrentUser } from "@/lib/auth/skill-access";
import { fetchOnboardingStateForUser } from "@/lib/onboarding/onboarding-repository";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function WillkommenPage() {
  const access = await getSkillAccessForCurrentUser();

  if (!access.userId && access.source !== "dev-fallback") {
    redirect(AUTH_ROUTES.login);
  }

  if (access.hasAccess) {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const user = supabase ? (await supabase.auth.getUser()).data.user : null;
      if (user) {
        const state = await fetchOnboardingStateForUser(user.id);
        if (state && !state.onboardingCompleted) {
          redirect("/onboarding/schritt-1");
        }
      }
    }
    redirect(AUTH_ROUTES.home);
  }

  const firstName =
    (access.userId && isSupabaseConfigured()
      ? (await fetchOnboardingStateForUser(access.userId))?.vorname
      : null) ??
    access.email?.split("@")[0]?.split(".")[0] ??
    "du";

  return (
    <div className="onboarding-fonts min-h-[100dvh] bg-[#4F46E5] px-4 py-12 text-white">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <HelpyCharacter size={180} pose="wave" animated className="drop-shadow-lg" />
        <h1 className="onboarding-display mt-8 text-[2.2rem] font-semibold leading-tight sm:text-[2.8rem]">
          Willkommen bei HELPY,
          <br />
          {firstName}! 🎉
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/80">
          Dein Konto ist erstellt. Wir prüfen deine Anfrage und schalten dich
          innerhalb von 24 Stunden frei. Du bekommst eine E-Mail sobald es losgeht.
        </p>

        <div className="mt-10 w-full rounded-[20px] bg-white p-6 text-left text-[#1E1B4B] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[#4F46E5]">
            Was passiert als nächstes
          </p>
          <ol className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#475569]">
            <li>① Wir prüfen deine Anfrage (bis 24h)</li>
            <li>② Du bekommst eine Freischalt-E-Mail</li>
            <li>③ Du richtest HELPY in 30 Min. ein</li>
            <li>④ HELPY arbeitet für dich</li>
          </ol>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-[14px] bg-white px-6 text-[14px] font-semibold text-[#4F46E5]"
          >
            Zurück zur Startseite
          </Link>
          <Link
            href={AUTH_ROUTES.login}
            className="inline-flex h-12 items-center justify-center rounded-[14px] border border-white/30 px-6 text-[14px] font-medium text-white/90"
          >
            Zur Login-Seite
          </Link>
        </div>
      </div>
    </div>
  );
}
