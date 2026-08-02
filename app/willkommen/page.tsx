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
    <div className="onboarding-fonts min-h-[100dvh] bg-[var(--landing-bg)] px-4 py-12 text-[var(--text-primary)]">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-gradient-to-b from-[var(--landing-glow)] to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center text-center">
        <HelpyCharacter size={180} pose="wave" animated className="drop-shadow-lg" />
        <h1 className="helpy-display mt-8 text-[2.2rem] font-semibold leading-tight sm:text-[2.8rem]">
          Willkommen bei HELPY,
          <br />
          {firstName}! 🎉
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[var(--text-secondary)]">
          Dein Konto ist erstellt. Wir prüfen deine Anfrage und schalten dich
          innerhalb von 24 Stunden frei. Du bekommst eine E-Mail sobald es losgeht.
        </p>

        <div className="mt-10 w-full rounded-xl border border-[var(--border)] bg-[var(--landing-surface)] p-6 text-left shadow-[var(--shadow-lg)]">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-accent)]">
            Was passiert als nächstes
          </p>
          <ol className="mt-4 space-y-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            <li>① Wir prüfen deine Anfrage (bis 24h)</li>
            <li>② Du bekommst eine Freischalt-E-Mail</li>
            <li>③ Du richtest HELPY in 30 Min. ein</li>
            <li>④ HELPY arbeitet für dich</li>
          </ol>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="helpy-btn-primary inline-flex h-12 items-center justify-center rounded-xl px-6 text-[14px]"
          >
            Zurück zur Startseite
          </Link>
          <Link
            href={AUTH_ROUTES.login}
            className="helpy-btn-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-[14px]"
          >
            Zur Login-Seite
          </Link>
        </div>
      </div>
    </div>
  );
}
