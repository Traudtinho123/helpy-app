"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
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
  HotLeadsSection,
  type HotLeadItem,
} from "@/features/lead-scoring/components/hot-leads-section";
import { FollowupsWorkdaySection } from "@/features/followup/components/followups-workday-section";
import { MatchesWorkdaySection } from "@/features/matching/components/matches-workday-section";
import { NurturingWorkdaySection } from "@/features/nurturing/components/nurturing-workday-section";
import { WorkdayBerichtSection } from "@/features/workday/components/workday-bericht-section";
import { WorkdayDashboardHero } from "@/features/workday/components/workday-dashboard-hero";
import { WorkdayTermineHeuteSection } from "@/features/workday/components/workday-termine-heute-section";
import type { WorkdayAnalytics } from "@/features/analytics/services/workday-analytics";
import {
  buildDashboardKpiItems,
  buildTodaySubtitle,
} from "@/features/workday/services/dashboard-kpi-builder";
import {
  getStableActiveOpenMailCasesCountSnapshot,
  subscribeVorgaengeCounts,
} from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
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

const PRIORITY_VISUAL: Record<
  Extract<WorkdayPriorityLevel, "kritisch" | "hoch">,
  {
    accent: string;
    glow: string;
    surface: string;
    border: string;
  }
> = {
  kritisch: {
    accent: "bg-[var(--danger)]",
    glow: "shadow-[0_8px_32px_rgba(239,68,68,0.12)]",
    surface: "bg-[var(--bg-surface)]",
    border: "border-[var(--danger-light)]",
  },
  hoch: {
    accent: "bg-[var(--warning)]",
    glow: "shadow-[0_8px_32px_rgba(245,158,11,0.1)]",
    surface: "bg-[var(--bg-surface)]",
    border: "border-[var(--warning-light)]",
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
        "group relative overflow-hidden rounded-xl border p-[1px] transition-all duration-300",
        visual.border,
        visual.glow,
        item.href && "hover:-translate-y-0.5 hover:border-[var(--border-accent)]"
      )}
    >
      <div
        className={cn(
          "relative flex gap-4 rounded-[11px] px-5 py-4",
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
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              {item.kategorieLabel}
            </span>
          </div>

          <p className="mt-2.5 text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {item.titel}
          </p>

          {item.absender && (
            <p className="mt-1 text-[12px] font-medium text-[var(--text-secondary)]">
              {item.absender}
            </p>
          )}

          <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--text-muted)]">
            {item.empfohleneAktion}
          </p>
        </div>

        {item.href && (
          <div className="flex shrink-0 items-center self-center">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-all duration-300",
                "group-hover:border-[var(--border-accent)] group-hover:bg-[var(--accent)] group-hover:text-white"
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
        <h3 className="text-[12px] font-semibold tracking-[0.04em] text-[var(--text-muted)] uppercase">
          {title}
        </h3>
        <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--text-secondary)]">
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
    <div className="rounded-xl border border-[var(--success-light)] bg-[var(--bg-surface)] px-6 py-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[var(--success-light)]">
        <ShieldCheck className="size-6 text-[var(--success)]" strokeWidth={2} />
      </div>
      <p className="mt-4 text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
        Keine kritischen oder hohen Prioritäten
      </p>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[var(--text-secondary)]">
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
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--danger-light)] bg-[var(--danger-light)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--danger)]">
                  {criticalItems.length} Kritisch
                </span>
              )}
              {highItems.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--warning-light)] bg-[var(--warning-light)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--warning)]">
                  {highItems.length} Hoch
                </span>
              )}
            </>
          )}
          {hasMore ? (
            <Link
              href="/vorgaenge"
              className="text-[12px] font-semibold text-[var(--text-accent)] hover:underline"
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
                  className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      resolvePriorityLevel(item) === "kritisch"
                        ? "bg-[var(--danger)]"
                        : "bg-[var(--warning)]"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                      {item.titel}
                    </p>
                    {item.absender ? (
                      <p className="truncate text-[11px] text-[var(--text-muted)]">
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
  const countsRevision = useStoreRevision(subscribeVorgaengeCounts);
  const openVorgaengeCount = useMemo(
    () => getStableActiveOpenMailCasesCountSnapshot(),
    [countsRevision]
  );

  const kpiItems = useMemo(
    () =>
      buildDashboardKpiItems({
        analytics,
        plan,
        todayAppointments,
        openVorgaengeCount,
      }),
    [analytics, plan, todayAppointments, openVorgaengeCount]
  );

  const subtitle = useMemo(
    () => buildTodaySubtitle(todayAppointments, openVorgaengeCount),
    [todayAppointments, openVorgaengeCount]
  );

  return (
    <div className="helpy-page py-5 lg:py-10">
      <div className="space-y-5 lg:space-y-6">
        <WorkdayDashboardHero
          greeting={greeting}
          subtitle={subtitle}
          isLoading={isMailLoading}
        />

        <KpiCards
          items={kpiItems}
          isLoading={isMailLoading || analyticsLoading}
        />
      </div>

      <div className="mt-8 space-y-8 lg:mt-10 lg:space-y-12">
        <WorkdayTermineHeuteSection appointments={todayAppointments} />

        <PrioritiesSection items={isMailLoading ? [] : plan.prioritizedItems} />

        <WorkdayBerichtSection
          analytics={analytics}
          isLoading={analyticsLoading || isMailLoading}
          error={analyticsError}
          extraKpis={extraAnalyticsKpis}
        />

        <FollowupsWorkdaySection />

        <NurturingWorkdaySection />

        <MatchesWorkdaySection />

        <HotLeadsSection leads={hotLeads} />
      </div>
    </div>
  );
}
