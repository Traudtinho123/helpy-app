import type { ReactNode } from "react";
import Link from "next/link";
import { Shield, Lock, Globe } from "lucide-react";
import { DataPrivacyTrustBadge } from "@/components/privacy/data-privacy-trust-badge";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  showDataPrivacyBadge?: boolean;
};

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
  showDataPrivacyBadge = false,
}: AuthPageShellProps) {
  const configured = isSupabaseConfigured();

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[var(--landing-bg)] text-[var(--text-primary)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[var(--landing-glow)] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-[var(--accent-glow)] blur-3xl opacity-60"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 py-10 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:py-16">
        <div className="mb-10 flex flex-1 flex-col items-center text-center lg:mb-0 lg:items-start lg:text-left">
          <HelpyCharacter size={100} pose="wave" animated />
          <p className="helpy-display mt-6 text-[2rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] lg:text-[2.5rem]">
            HELPY
          </p>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Die KI-Office für Immobilienprofis — Vorgänge, Objekte und
            Kommunikation an einem Ort.
          </p>
          <ul className="mt-8 hidden space-y-3 text-left text-[13px] text-[var(--text-secondary)] lg:block">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              Gmail & Plattform-Anfragen automatisch erkannt
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              Objekte, Kunden und Pipeline vernetzt
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              DSGVO-konform · Daten in Europa
            </li>
          </ul>
        </div>

        <div className="w-full max-w-[440px] shrink-0 lg:mx-0 lg:ml-auto">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--landing-surface)] p-8 shadow-[var(--shadow-lg)]">
            <div className="mb-8 text-center lg:text-left">
              <h1 className="helpy-display text-[1.75rem] font-semibold text-[var(--text-primary)]">
                {title}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                {subtitle}
              </p>
            </div>

            {!configured && (
              <div
                className={cn(
                  "mb-6 rounded-lg border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[var(--warning-light)] px-4 py-3",
                  "text-[13px] leading-relaxed text-[var(--warning)]"
                )}
              >
                Supabase ist noch nicht konfiguriert. Die App läuft im Demo-Modus.
              </div>
            )}

            {children}
          </div>

          {footer && (
            <div className="mt-6 text-center text-[13px] text-[var(--text-muted)] lg:text-left">
              {footer}
            </div>
          )}

          {showDataPrivacyBadge ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[var(--text-muted)] lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Globe className="size-3.5 text-[var(--accent)]" />
                Daten in Europa
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="size-3.5 text-[var(--accent)]" />
                DSGVO-konform
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="size-3.5 text-[var(--accent)]" />
                Keine Weitergabe
              </span>
            </div>
          ) : null}

          <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[var(--text-muted)] lg:justify-start">
            <Link href="/datenschutz" className="hover:text-[var(--text-accent)]">
              Datenschutz
            </Link>
            <Link href="/agb" className="hover:text-[var(--text-accent)]">
              AGB
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
