"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { WorkdayAnalyticsDashboard } from "@/features/workday/components/workday-analytics-dashboard";
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
    <Card className="relative overflow-hidden rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#2563EB]/8 to-transparent" />
      <CardContent className="relative p-7 lg:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-[0_4px_20px_rgba(37,99,235,0.35)]">
            <Sparkles className="size-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
              Tagesübersicht
            </h2>
            <p className="mt-1 text-[13px] text-[#64748B]">
              {isLoading
                ? "HELPY lädt deine Gmail-Vorgänge…"
                : plan.summary}
            </p>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plan.statusMetrics.map(({ label, value }) => (
            <li
              key={label}
              className="flex items-center gap-3.5 rounded-[16px] border border-[#CBD5E1]/40 bg-[#F8FAFC]/80 px-4 py-3.5 backdrop-blur-sm"
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[1.375rem] font-bold leading-none tracking-[-0.03em] text-[#0F172A]",
                    isLoading &&
                      "inline-block min-w-[2ch] animate-pulse rounded-md bg-[#E2E8F0]/80 text-transparent"
                  )}
                >
                  {isLoading ? "0" : value}
                </p>
                <p className="mt-1 text-[12px] font-medium text-[#64748B]">
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

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="helpy-h2">Prioritäten</h2>
          <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">
            Nur kritische und hohe Vorgänge — sortiert nach Dringlichkeit
          </p>
        </div>

        {visibleItems.length > 0 && (
          <div className="flex items-center gap-2">
            {criticalItems.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FECACA]/60 bg-[#FEF2F2] px-3 py-1 text-[11px] font-semibold text-[#DC2626]">
                <span className="size-1.5 rounded-full bg-[#DC2626]" />
                {criticalItems.length} Kritisch
              </span>
            )}
            {highItems.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A]/70 bg-[#FFFBEB] px-3 py-1 text-[11px] font-semibold text-[#B45309]">
                <span className="size-1.5 rounded-full bg-[#D97706]" />
                {highItems.length} Hoch
              </span>
            )}
          </div>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <PrioritiesEmptyState />
      ) : (
        <div className="space-y-6">
          <PriorityGroup
            title="Kritisch"
            count={criticalItems.length}
            items={criticalItems}
            level="kritisch"
          />
          <PriorityGroup
            title="Hoch"
            count={highItems.length}
            items={highItems}
            level="hoch"
          />
        </div>
      )}
    </section>
  );
}

function TermineVonHeuteSection({
  appointments,
  calendarPlatform = null,
}: {
  appointments: WorkdayTerminItem[];
  calendarPlatform?: CalendarPlatform | null;
}) {
  const emptyMessage =
    calendarPlatform === "apple"
      ? "Heute sind keine Termine im Apple Kalender."
      : calendarPlatform === "google"
        ? "Heute sind keine Termine im Google Kalender."
        : "Heute sind noch keine Kalendertermine verbunden.";
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#ECFDF5]">
          <CalendarDays className="size-5 text-[#047857]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="helpy-h2">Termine von heute</h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Termine aus deiner verbundenen Kalender-Plattform
          </p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <p className="text-[13px] text-[#64748B]">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((termin) => (
            <li
              key={termin.id}
              className="rounded-[20px] border border-[#CBD5E1]/50 bg-white/90 px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-[#0F172A]">
                      {termin.titel}
                    </p>
                    <Badge
                      variant="outline"
                      className="h-5 rounded-full border-[#CBD5E1] px-2 text-[10px] font-medium text-[#64748B]"
                    >
                      {termin.quelle}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-[#64748B]">{termin.kunde}</p>
                  {termin.uhrzeit && (
                    <p className="text-[12px] font-medium text-[#047857]">
                      {termin.uhrzeit} Uhr
                    </p>
                  )}
                </div>
                <Link
                  href={termin.href}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[12px] border border-[#CBD5E1]/60 bg-white/90 px-4 text-[12px] font-medium text-[#334155] transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]/40"
                >
                  Prüfen
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MeinArbeitstagPage({
  plan,
  greeting,
  todayAppointments = [],
  calendarPlatform = null,
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
    <div className="mx-auto max-w-6xl px-8 py-12 lg:px-12 lg:py-14">
      <header className="mb-12">
        <p className="helpy-label">{today}</p>
        <h1 className="helpy-h1 mt-3">{greeting}</h1>
        <p className="helpy-greeting-sub mt-4 max-w-2xl">
          Ich habe deinen Arbeitstag organisiert — fokussiert auf das, was heute
          zählt.
        </p>
      </header>

      <div className="space-y-12">
        <WorkdayAnalyticsDashboard
          analytics={analytics}
          isLoading={analyticsLoading || isMailLoading}
          error={analyticsError}
          extraKpis={extraAnalyticsKpis}
        />
        {!analytics && !analyticsLoading && (
          <TagesuebersichtCard plan={plan} isLoading={isMailLoading} />
        )}
        <PrioritiesSection items={isMailLoading ? [] : plan.prioritizedItems} />
        <HotLeadsSection leads={hotLeads} />
        <FollowupsWorkdaySection />
        <TermineVonHeuteSection
          appointments={todayAppointments}
          calendarPlatform={calendarPlatform}
        />
      </div>
    </div>
  );
}
