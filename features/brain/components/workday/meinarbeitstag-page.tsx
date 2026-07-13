"use client";

import Link from "next/link";
import {
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  DailyPlan,
  PrioritizedWorkdayItem,
  WorkdayPriorityLevel,
} from "@/features/brain/services/helpy-brain/types";
import type { WorkdayTerminItem } from "@/features/workday/services/workday-summary";
import { isCriticalOrHighPriorityItem } from "@/features/workday/services/workday-summary";
import type { CalendarPlatform } from "@/features/calendar/services/calendar-platform";
import {
  buildHotLeadItems,
  HotLeadsSection,
  type HotLeadItem,
} from "@/features/lead-scoring/components/hot-leads-section";
import { FollowupsWorkdaySection } from "@/features/followup/components/followups-workday-section";
import { WorkdayBerichtSection } from "@/features/workday/components/workday-bericht-section";
import { WorkdayTermineHeuteSection } from "@/features/workday/components/workday-termine-heute-section";
import type { WorkdayAnalytics } from "@/features/analytics/services/workday-analytics";
import { cn } from "@/lib/utils";

type MeinArbeitstagPageProps = {
  plan: DailyPlan;
  greeting: string;
  todayAppointments?: WorkdayTerminItem[];
  calendarPlatform?: CalendarPlatform | null;
  isMailLoading?: boolean;
  analytics?: WorkdayAnalytics | null;
  analyticsLoading?: boolean;
  analyticsError?: string | null;
  extraAnalyticsKpis?: import("@/features/analytics/services/workday-analytics").WorkdayKpiMetric[];
  hotLeads?: HotLeadItem[];
};

function TagesuebersichtCard({
  plan,
  isLoading = false,
}: {
  plan: DailyPlan;
  isLoading?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-[24px] py-0",
        "border border-[var(--card-border)] bg-[rgba(255,255,255,0.9)]",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_40px_rgba(99,102,241,0.08)]",
        "ring-1 ring-white/80 backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)]"
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--primary)]/10 to-transparent" />
      <CardContent className="relative p-7 lg:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[var(--button-primary-from)] to-[var(--button-primary-to)] shadow-[var(--button-primary-shadow)]">
            <Sparkles className="size-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="helpy-h2 text-[1.25rem]">Tagesübersicht</h2>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              {isLoading
                ? "HELPY lädt deine Gmail-Vorgänge…"
                : plan.summary}
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {plan.statusMetrics.map(({ label, value }) => (
            <li
              key={label}
              className="flex items-center gap-3.5 rounded-[16px] border border-[var(--card-border)] bg-[var(--background-secondary)]/80 px-4 py-3.5 backdrop-blur-sm"
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[1.375rem] font-bold leading-none tracking-[-0.03em] text-[var(--text-primary)]",
                    isLoading &&
                      "inline-block min-w-[2ch] animate-pulse rounded-md bg-[var(--background-secondary)] text-transparent"
                  )}
                >
                  {isLoading ? "0" : value}
                </p>
                <p className="mt-1 text-[12px] font-medium text-[var(--text-secondary)]">
                  {label}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

const PRIORITY_VISUAL: Record<
  Extract<WorkdayPriorityLevel, "kritisch" | "hoch">,
  {
    accent: string;
    glow: string;
    surface: string;
    border: string;
    iconBg: string;
  }
> = {
  kritisch: {
    accent: "bg-[#DC2626]",
    glow: "shadow-[0_8px_32px_rgba(220,38,38,0.12)]",
    surface: "bg-gradient-to-br from-[#FEF2F2]/90 via-white to-white",
    border: "border-[#FECACA]/60",
    iconBg: "bg-[#FEE2E2] text-[#DC2626]",
  },
  hoch: {
    accent: "bg-[#D97706]",
    glow: "shadow-[0_8px_32px_rgba(217,119,6,0.1)]",
    surface: "bg-gradient-to-br from-[#FFFBEB]/90 via-white to-white",
    border: "border-[#FDE68A]/70",
    iconBg: "bg-[#FEF3C7] text-[#B45309]",
  },
};

function resolvePriorityLevel(
  item: PrioritizedWorkdayItem
): Extract<WorkdayPriorityLevel, "kritisch" | "hoch"> {
  if (item.prioritaet === "kritisch" || item.prioritaetLabel === "Kritisch") {
    return "kritisch";
  }
  return "hoch";
}

function PriorityCard({ item }: { item: PrioritizedWorkdayItem }) {
  const level = resolvePriorityLevel(item);
  const visual = PRIORITY_VISUAL[level];
  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[20px] border p-[1px] transition-all duration-300",
        visual.border,
        visual.glow,
        item.href && "hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(15,23,42,0.08)]"
      )}
    >
      <div
        className={cn(
          "relative flex gap-4 rounded-[19px] px-5 py-4 backdrop-blur-xl",
          visual.surface
        )}
      >
        <div
          className={cn(
            "absolute inset-y-3 left-0 w-[3px] rounded-full",
            visual.accent
          )}
        />

        <div className="min-w-0 flex-1 pl-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              variant={level}
              className="h-6 px-2.5 text-[10px]"
            />
            <span className="text-[11px] font-medium text-[#94A3B8]">
              {item.kategorieLabel}
            </span>
          </div>

          <p className="mt-2.5 text-[15px] font-semibold tracking-[-0.02em] text-[#0F172A]">
            {item.titel}
          </p>

          {item.absender && (
            <p className="mt-1 text-[12px] font-medium text-[#64748B]">
              {item.absender}
            </p>
          )}

          <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-[#64748B]">
            {item.empfohleneAktion}
          </p>
        </div>

        {item.href && (
          <div className="flex shrink-0 items-center self-center">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full bg-white/80 text-[#64748B] ring-1 ring-[#E2E8F0]/80 transition-all duration-300",
                "group-hover:bg-[#2563EB] group-hover:text-white group-hover:ring-[#2563EB]/30"
              )}
            >
              <ChevronRight className="size-4" strokeWidth={2.5} />
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (!item.href) return content;

  return (
    <Link href={item.href} className="block focus-visible:outline-none">
      {content}
    </Link>
  );
}

function PriorityGroup({
  title,
  count,
  items,
  level,
}: {
  title: string;
  count: number;
  items: PrioritizedWorkdayItem[];
  level: Extract<WorkdayPriorityLevel, "kritisch" | "hoch">;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5 px-1">
        <span
          className={cn("size-2 rounded-full", PRIORITY_VISUAL[level].accent)}
        />
        <h3 className="text-[12px] font-semibold tracking-[0.04em] text-[#64748B] uppercase">
          {title}
        </h3>
        <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#475569]">
          {count}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="helpy-fade-in-slide">
            <PriorityCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrioritiesEmptyState() {
  return (
    <div className="rounded-[24px] border border-[#A7F3D0]/50 bg-gradient-to-br from-[#ECFDF5]/80 via-white to-white px-6 py-8 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-white backdrop-blur-xl">
      <div className="mx-auto flex size-12 items-center justify-center rounded-[16px] bg-[#D1FAE5]">
        <ShieldCheck className="size-6 text-[#047857]" strokeWidth={2} />
      </div>
      <p className="mt-4 text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
        Keine kritischen oder hohen Prioritäten
      </p>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[#64748B]">
        Alles im Griff — HELPY zeigt hier nur Vorgänge mit kritischer oder hoher
        Priorität.
      </p>
    </div>
  );
}

function PrioritiesSection({ items }: { items: PrioritizedWorkdayItem[] }) {
  const visibleItems = items.filter(isCriticalOrHighPriorityItem);
  const criticalItems = visibleItems.filter(
    (item) => resolvePriorityLevel(item) === "kritisch"
  );
  const highItems = visibleItems.filter(
    (item) => resolvePriorityLevel(item) === "hoch"
  );
  const orderedItems = [...criticalItems, ...highItems];
  const previewItems = orderedItems.slice(0, 3);
  const hasMore = orderedItems.length > 3;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="helpy-h2 text-[1.2rem]">Prioritäten</h2>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            Kritische und hohe Vorgänge — nach Dringlichkeit
          </p>
        </div>

        <div className="flex items-center gap-2">
          {visibleItems.length > 0 && (
            <>
              {criticalItems.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FECACA]/60 bg-[#FEF2F2] px-2.5 py-0.5 text-[10px] font-semibold text-[#DC2626]">
                  {criticalItems.length} Kritisch
                </span>
              )}
              {highItems.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A]/70 bg-[#FFFBEB] px-2.5 py-0.5 text-[10px] font-semibold text-[#B45309]">
                  {highItems.length} Hoch
                </span>
              )}
            </>
          )}
          {hasMore ? (
            <Link
              href="/vorgaenge"
              className="text-[12px] font-semibold text-[#2563EB] hover:underline"
            >
              Alle anzeigen
            </Link>
          ) : null}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <PrioritiesEmptyState />
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {previewItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href ?? "/vorgaenge"}
                  className="flex items-start gap-2 rounded-[12px] border border-[#E2E8F0]/80 bg-white px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      resolvePriorityLevel(item) === "kritisch"
                        ? "bg-[#DC2626]"
                        : "bg-[#D97706]"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[#0F172A]">
                      {item.titel}
                    </p>
                    {item.absender ? (
                      <p className="truncate text-[11px] text-[#64748B]">
                        {item.absender}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden space-y-4 md:block">
            <PriorityGroup
              title="Kritisch"
              count={criticalItems.length}
              items={criticalItems.slice(0, 3)}
              level="kritisch"
            />
            <PriorityGroup
              title="Hoch"
              count={highItems.length}
              items={highItems.slice(0, Math.max(0, 3 - criticalItems.length))}
              level="hoch"
            />
          </div>
        </>
      )}
    </section>
  );
}

export function MeinArbeitstagPage({
  plan,
  greeting,
  todayAppointments = [],
  isMailLoading = false,
  analytics = null,
  analyticsLoading = false,
  analyticsError = null,
  extraAnalyticsKpis = [],
  hotLeads = [],
}: MeinArbeitstagPageProps) {
  const today = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 lg:px-12 lg:py-14">
      <header className="mb-8 lg:mb-12">
        <p className="helpy-label text-[11px]">{today}</p>
        <h1 className="helpy-h1 mt-2 text-[1.5rem] lg:mt-3 lg:text-[2rem]">{greeting}</h1>
        <p className="helpy-greeting-sub mt-2 max-w-2xl text-[13px] lg:mt-4 lg:text-[15px]">
          Ich habe deinen Arbeitstag organisiert — fokussiert auf das, was heute
          zählt.
        </p>
      </header>

      <div className="space-y-8 lg:space-y-12">
        <WorkdayTermineHeuteSection appointments={todayAppointments} />

        <PrioritiesSection items={isMailLoading ? [] : plan.prioritizedItems} />

        <WorkdayBerichtSection
          analytics={analytics}
          isLoading={analyticsLoading || isMailLoading}
          error={analyticsError}
          extraKpis={extraAnalyticsKpis}
        />

        {!analytics && !analyticsLoading && (
          <TagesuebersichtCard plan={plan} isLoading={isMailLoading} />
        )}

        <FollowupsWorkdaySection />

        <HotLeadsSection leads={hotLeads} />
      </div>
    </div>
  );
}
