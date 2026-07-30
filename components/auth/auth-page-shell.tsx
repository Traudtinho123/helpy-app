import type { ReactNode } from "react";
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
    <div className="relative flex min-h-full flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-12 text-[var(--color-ink)]">
      <div className="relative w-full max-w-[440px]">
        <div className="mb-10 flex flex-col items-center">
          <HelpyCharacter size={80} pose="wave" animated />
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-8)] shadow-[var(--shadow-md)]">
          <div className="mb-8 text-center">
            <h1 className="helpy-display text-[var(--text-3xl)] font-semibold text-[var(--color-ink)]">
              {title}
            </h1>
            <p className="mt-3 text-[var(--text-base)] leading-[var(--leading-normal)] text-[var(--color-ink-3)]">
              {subtitle}
            </p>
          </div>

          {!configured && (
            <div
              className={cn(
                "mb-6 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)] bg-[var(--color-warning-light)] px-4 py-3",
                "text-[var(--text-sm)] leading-[var(--leading-normal)] text-[var(--color-warning)]"
              )}
            >
              Supabase ist noch nicht konfiguriert. Die App läuft im Demo-Modus —
              Auth-Funktionen sind vorbereitet, aber noch nicht aktiv.
            </div>
          )}

          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-[var(--text-sm)] text-[var(--color-ink-3)]">
            {footer}
          </div>
        )}

        {showDataPrivacyBadge ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[var(--text-sm)] text-[var(--color-ink-3)]">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="size-4 text-[var(--color-primary)]" />
              Daten in Europa
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="size-4 text-[var(--color-primary)]" />
              DSGVO-konform
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-4 text-[var(--color-primary)]" />
              Keine Weitergabe
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
