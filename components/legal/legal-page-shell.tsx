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
    <div className="min-h-full bg-[var(--color-bg)] px-4 py-10 text-[var(--color-ink)] sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center gap-6 sm:mb-10">
          <Link href={AUTH_ROUTES.login} aria-label="Zur Startseite">
            <HelpyLogo size="md" variant="dark" />
          </Link>
          <div className="text-center">
            <h1 className="helpy-display text-[var(--text-3xl)] font-semibold text-[var(--color-ink)] sm:text-[2rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-[var(--text-base)] leading-[var(--leading-normal)] text-[var(--color-ink-3)]">
                {subtitle}
              </p>
            ) : null}
            <p className="mt-2 text-[var(--text-sm)] text-[var(--color-ink-4)]">
              Stand: {lastUpdated}
            </p>
          </div>
        </div>

        <article className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-10">
          <div className="legal-prose">{children}</div>
        </article>

        <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[var(--text-sm)] text-[var(--color-ink-3)]">
          <Link
            href="/datenschutz"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Datenschutz
          </Link>
          <Link
            href="/agb"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            AGB
          </Link>
          <Link
            href={AUTH_ROUTES.login}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Anmelden
          </Link>
        </footer>
      </div>
    </div>
  );
}
