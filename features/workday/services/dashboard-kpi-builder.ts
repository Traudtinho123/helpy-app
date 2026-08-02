import type { WorkdayAnalytics } from "@/features/analytics/services/workday-analytics";
import type { DailyPlan } from "@/features/brain/services/helpy-brain/types";
import type { WorkdayTerminItem } from "@/features/workday/services/workday-summary";
import type { KpiCardItem } from "@/components/dashboard/kpi-cards";

function findAnalyticsKpi(analytics: WorkdayAnalytics | null | undefined, id: string) {
  return analytics?.kpis.find((metric) => metric.id === id);
}

function formatTrend(
  changePercent: number,
  trend: "up" | "down" | "flat"
): { label: string; direction: "up" | "down" | "neutral" } {
  if (trend === "flat" || changePercent === 0) {
    return { label: "Stabil", direction: "neutral" };
  }
  const prefix = changePercent > 0 ? "+" : "";
  return {
    label: `${prefix}${changePercent}%`,
    direction: trend === "up" ? "up" : "down",
  };
}

function metricFromAnalytics(
  analytics: WorkdayAnalytics | null | undefined,
  id: string,
  fallbackLabel: string,
  fallbackValue: number
): Pick<KpiCardItem, "value" | "trend" | "trendDirection" | "label"> {
  const metric = findAnalyticsKpi(analytics, id);
  if (!metric) {
    return {
      label: fallbackLabel,
      value: fallbackValue,
      trend: "—",
      trendDirection: "neutral",
    };
  }

  const { label, direction } = formatTrend(metric.changePercent, metric.trend);
  return {
    label: metric.label,
    value: metric.current,
    trend: label,
    trendDirection: direction,
  };
}

function readPlanMetric(plan: DailyPlan, labelIncludes: string): number {
  const match = plan.statusMetrics.find((metric) =>
    metric.label.toLowerCase().includes(labelIncludes.toLowerCase())
  );
  return match?.value ?? 0;
}

export function buildDashboardKpiItems(input: {
  analytics?: WorkdayAnalytics | null;
  plan: DailyPlan;
  todayAppointments: WorkdayTerminItem[];
  openVorgaengeCount: number;
}): KpiCardItem[] {
  const { analytics, plan, todayAppointments, openVorgaengeCount } = input;

  const vorgaengeFallback =
    openVorgaengeCount > 0
      ? openVorgaengeCount
      : readPlanMetric(plan, "vorgänge") || readPlanMetric(plan, "vorbereitet");

  const besichtigungenFallback =
    todayAppointments.length > 0
      ? todayAppointments.length
      : readPlanMetric(plan, "besichtigung") ||
        readPlanMetric(plan, "termine");

  const vorgaenge = metricFromAnalytics(
    analytics,
    "processed",
    "Vorgänge",
    vorgaengeFallback
  );
  if (openVorgaengeCount > 0 && !findAnalyticsKpi(analytics, "processed")) {
    vorgaenge.value = openVorgaengeCount;
    vorgaenge.label = "Vorgänge";
  }

  const besichtigungen = metricFromAnalytics(
    analytics,
    "appointments",
    "Besichtigungen",
    besichtigungenFallback
  );
  if (
    todayAppointments.length > 0 &&
    !findAnalyticsKpi(analytics, "appointments") &&
    !findAnalyticsKpi(analytics, "appointments-upcoming") &&
    !findAnalyticsKpi(analytics, "appointments-scheduled")
  ) {
    besichtigungen.value = todayAppointments.length;
    besichtigungen.label = "Besichtigungen";
  }

  const neueKunden = metricFromAnalytics(
    analytics,
    "inquiries",
    "Neue Kd.",
    readPlanMetric(plan, "interessent") || 0
  );
  const customersMetric = findAnalyticsKpi(analytics, "customers");
  if (customersMetric) {
    const { label, direction } = formatTrend(
      customersMetric.changePercent,
      customersMetric.trend
    );
    neueKunden.label = "Neue Kd.";
    neueKunden.value = customersMetric.current;
    neueKunden.trend = label;
    neueKunden.trendDirection = direction;
  }

  const anrufe = metricFromAnalytics(analytics, "voice-calls", "Anrufe", 0);

  return [
    { id: "vorgaenge", icon: "vorgaenge", accent: "accent", ...vorgaenge },
    { id: "besichtigungen", icon: "besichtigungen", accent: "success", ...besichtigungen },
    { id: "neue-kunden", icon: "neue-kunden", accent: "warning", ...neueKunden },
    { id: "anrufe", icon: "anrufe", accent: "danger", ...anrufe },
  ];
}

export function buildTodaySubtitle(
  todayAppointments: WorkdayTerminItem[],
  openVorgaengeCount: number
): string {
  const parts: string[] = [];

  if (todayAppointments.length > 0) {
    parts.push(
      `${todayAppointments.length} Besichtigung${todayAppointments.length === 1 ? "" : "en"}`
    );
  }

  if (openVorgaengeCount > 0) {
    parts.push(
      `${openVorgaengeCount} offene Vorgänge`
    );
  }

  if (parts.length === 0) {
    return "Alles im Griff — HELPY hält den Überblick.";
  }

  return `Heute: ${parts.join(" · ")}`;
}
