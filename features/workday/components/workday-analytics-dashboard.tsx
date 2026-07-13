"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StripeKpiTile } from "@/components/dashboard/stripe-kpi-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  WorkdayAnalytics,
  WorkdayKpiMetric,
} from "@/features/analytics/services/workday-analytics";

type WorkdayAnalyticsDashboardProps = {
  analytics: WorkdayAnalytics | null;
  isLoading?: boolean;
  error?: string | null;
  extraKpis?: WorkdayKpiMetric[];
  forceShowCharts?: boolean;
};

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
    <div className="helpy-glass-card rounded-[12px] px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-[13px] font-semibold text-[var(--text-primary)]"
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
  forceShowCharts = false,
}: WorkdayAnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <Card className="helpy-glass-card py-0">
        <CardContent className="p-7 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-[var(--background-secondary)]" />
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 rounded-[16px] bg-[var(--background-secondary)]"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="helpy-glass-card border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[var(--danger-light)]/50 py-0">
        <CardContent className="p-6 text-[13px] text-[var(--danger)]">{error}</CardContent>
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

  const showCharts = analytics.hasEventData || forceShowCharts;

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)]">
          <TrendingUp className="size-5 text-[var(--primary)]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="helpy-h2">Wochenübersicht</h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Kennzahlen dieser Woche im Vergleich zur Vorwoche
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {kpiTiles.map((metric, index) => (
          <StripeKpiTile
            key={metric.id}
            metric={metric}
            style={{ animationDelay: `${index * 60}ms` }}
          />
        ))}
      </div>

      {showCharts ? (
        <div className="charts-section grid gap-4 lg:grid-cols-2">
          <Card className="helpy-glass-card py-0">
            <CardHeader className="border-b border-[var(--card-border)]">
              <CardTitle className="helpy-h2 text-base">Heute nach Uhrzeit</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.todayHourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--background-secondary)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="helpy-glass-card py-0">
            <CardHeader className="border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-[var(--primary)]" />
                <CardTitle className="helpy-h2 text-base">Wochenvergleich</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.weekDaily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--background-secondary)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="previous"
                      fill="var(--text-muted)"
                      opacity={0.35}
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar dataKey="current" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
