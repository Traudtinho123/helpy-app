"use client";

import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { cn } from "@/lib/utils";

type WorkdayDashboardHeroProps = {
  greeting: string;
  subtitle: string;
  isLoading?: boolean;
  className?: string;
};

export function WorkdayDashboardHero({
  greeting,
  subtitle,
  isLoading = false,
  className,
}: WorkdayDashboardHeroProps) {
  const today = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6 lg:p-8",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[var(--accent-glow)] blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <HelpyCharacter size={72} pose="wave" animated showLabel={false} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase">
            {today}
          </p>
          <h1 className="helpy-display mt-1 text-[1.65rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[1.85rem] lg:text-[2rem]">
            {greeting}
          </h1>
          <p
            className={cn(
              "mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]",
              isLoading && "animate-pulse text-[var(--text-muted)]"
            )}
          >
            {isLoading ? "HELPY lädt deinen Arbeitstag…" : subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
