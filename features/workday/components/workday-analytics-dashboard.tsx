"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  WorkdayAnalytics,
  WorkdayKpiMetric,
} from "@/features/analytics/services/workday-analytics";
import { cn } from "@/lib/utils";

type WorkdayAnalyticsDashboardProps = {
  analytics: WorkdayAnalytics | null;
  isLoading?: boolean;
  error?: string | null;
  extraKpis?: WorkdayKpiMetric[];
};

function TrendBadge({ metric }: { metric: WorkdayKpiMetric }) {
  if (metric.mode === "snapshot") {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#64748B]">
        {metric.snapshotHint ?? "Aktueller Stand"}
      </span>
    );
  }

  const Icon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : ArrowRight;

  const colorClass =
    metric.trend === "up"
      ? "text-[#10B981]"
      : metric.trend === "down"
        ? "text-[#EF4444]"
        : "text-[#94A3B8]";

  const prefix = metric.changePercent > 0 ? "+" : "";

  return (
    <span className={cn("inline-flex items-center gap-1 text-[12px] font-semibold", colorClass)}>
      <Icon className="size-3.5" strokeWidth={2.5} />
      {prefix}
      {metric.changePercent}%
      <span className="font-normal text-[#94A3B8]">vs. Vorwoche</span>
    </span>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  const data = values.map((value, index) => ({ index, value }));

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563EB"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiTile({ metric }: { metric: WorkdayKpiMetric }) {
  return (
    <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-white backdrop-blur-xl">
      <CardContent className="p-5">
        <p className="text-[12px] font-medium text-[#64748B]">{metric.label}</p>
        <p className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.04em] text-[#0F172A]">
          {metric.current}
        </p>
        <div className="mt-2">
          <TrendBadge metric={metric} />
        </div>
        <div className="mt-3">
          <MiniSparkline values={metric.sparkline} />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-[#64748B]">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-[13px] font-semibold text-[#0F172A]"
          style={{ color: entry.color }}
        >
          {entry.dataKey === "previous" ? "Vorwoche" : "Diese Woche"}: {entry.value ?? 0}
        </p>
      ))}
    </div>
  );
}

export function WorkdayAnalyticsDashboard({
  analytics,
  isLoading = false,
  error = null,
  extraKpis = [],
}: WorkdayAnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
        <CardContent className="p-7 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-[#E2E8F0]" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-36 rounded-[20px] bg-[#F1F5F9]" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-[24px] border-[#FECACA]/60 bg-[#FEF2F2]/50 py-0">
        <CardContent className="p-6 text-[13px] text-[#B91C1C]">{error}</CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const kpiTiles = [
    ...analytics.kpis.filter(
      (metric) => !extraKpis.some((extra) => extra.id === metric.id)
    ),
    ...extraKpis,
  ];

  const showCharts = analytics.hasEventData;

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-[0_4px_20px_rgba(37,99,235,0.35)]">
          <TrendingUp className="size-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
            Wochenübersicht
          </h2>
          <p className="mt-1 text-[13px] text-[#64748B]">
            Kennzahlen dieser Woche im Vergleich zur Vorwoche
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {kpiTiles.map((metric) => (
          <KpiTile key={metric.id} metric={metric} />
        ))}
      </div>

      {!showCharts ? (
        <Card className="rounded-[20px] border-dashed border-[#CBD5E1]/70 bg-[#F8FAFC]/80 py-0">
          <CardContent className="flex items-center gap-3 p-5 text-[13px] text-[#64748B]">
            <BarChart3 className="size-4 shrink-0" />
            Sobald Vorgänge synchronisiert sind, erscheinen hier Tages- und Wochencharts.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-semibold text-[#0F172A]">
                Heute im Überblick
              </CardTitle>
              <p className="text-[12px] font-normal text-[#64748B]">
                Eingegangene Vorgänge nach Stunde ({analytics.workHoursStart}:00–
                {analytics.workHoursEnd}:00)
              </p>
            </CardHeader>
            <CardContent className="h-64 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.todayHourly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-semibold text-[#0F172A]">
                Diese Woche
              </CardTitle>
              <p className="text-[12px] font-normal text-[#64748B]">
                Vorgänge pro Tag — blau diese Woche, grau Vorwoche
              </p>
            </CardHeader>
            <CardContent className="h-64 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analytics.weekDaily}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="current" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={24} />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#94A3B8" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
