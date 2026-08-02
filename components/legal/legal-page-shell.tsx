import type { ReactNode } from "react";
import Link from "next/link";
import { HelpyLogo } from "@/components/helpy/helpy-logo";
import { AUTH_ROUTES } from "@/lib/auth/routes";

type LegalPageShellProps = {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalPageShell({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalPageShellProps) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[var(--landing-bg)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[var(--landing-glow)] to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center gap-6 sm:mb-10">
          <Link href={AUTH_ROUTES.login} aria-label="Zur Startseite">
            <HelpyLogo size="md" variant="light" />
          </Link>
          <div className="text-center">
            <h1 className="helpy-display text-[var(--text-3xl)] font-semibold text-[var(--text-primary)] sm:text-[2rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-[var(--text-base)] leading-[var(--leading-normal)] text-[var(--text-secondary)]">
                {subtitle}
              </p>
            ) : null}
            <p className="mt-2 text-[var(--text-sm)] text-[var(--text-muted)]">
              Stand: {lastUpdated}
            </p>
          </div>
        </div>

        <article className="rounded-xl border border-[var(--border)] bg-[var(--landing-surface)] p-6 shadow-[var(--shadow-md)] sm:p-10">
          <div className="legal-prose">{children}</div>
        </article>

        <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[var(--text-sm)] text-[var(--text-muted)]">
          <Link
            href="/datenschutz"
            className="font-medium text-[var(--text-accent)] hover:underline"
          >
            Datenschutz
          </Link>
          <Link
            href="/agb"
            className="font-medium text-[var(--text-accent)] hover:underline"
          >
            AGB
          </Link>
          <Link
            href={AUTH_ROUTES.login}
            className="font-medium text-[var(--text-accent)] hover:underline"
          >
            Anmelden
          </Link>
        </footer>
      </div>
    </div>
  );
}
