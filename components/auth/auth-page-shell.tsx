import type { ReactNode } from "react";
import { DataPrivacyTrustBadge } from "@/components/privacy/data-privacy-trust-badge";
import { HelpyLogo } from "@/components/helpy/helpy-logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Dezentes Trust-Badge unterhalb der Auth-Karte (Login/Registrierung). */
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
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-[#EEF4FC] px-4 py-12 text-[#0F172A]">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#EEF4FC] via-[#E8F0FA] to-[#DBEAFE]/40" />
      <div className="pointer-events-none fixed -top-40 -left-20 size-[600px] rounded-full bg-[#2563EB]/15 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/4 -right-32 size-[550px] rounded-full bg-[#3B82F6]/12 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-32 left-1/4 size-[480px] rounded-full bg-[#60A5FA]/18 blur-[110px]" />

      <div className="relative w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <HelpyLogo size="lg" />
        </div>

        <div className="rounded-[24px] border border-white/60 bg-white/85 p-8 shadow-[0_16px_48px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
              {title}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#64748B]">
              {subtitle}
            </p>
          </div>

          {!configured && (
            <div
              className={cn(
                "mb-6 rounded-[14px] border border-[#FDE68A]/60 bg-[#FFFBEB]/80 px-4 py-3",
                "text-[12px] leading-relaxed text-[#92400E]"
              )}
            >
              Supabase ist noch nicht konfiguriert. Die App läuft im Demo-Modus —
              Auth-Funktionen sind vorbereitet, aber noch nicht aktiv.
            </div>
          )}

          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-[13px] text-[#64748B]">
            {footer}
          </div>
        )}

        {showDataPrivacyBadge ? (
          <div className="mt-5">
            <DataPrivacyTrustBadge />
          </div>
        ) : null}
      </div>
    </div>
  );
}
