"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Inbox,
  Phone,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkdayKpiMetric } from "@/features/analytics/services/workday-analytics";
import { cn } from "@/lib/utils";

export type KpiAccent = "primary" | "success" | "warning";

const accentStyles: Record<
  KpiAccent,
  { iconColor: string; iconBg: string }
> = {
  primary: {
    iconColor: "text-[var(--primary)]",
    iconBg: "bg-[var(--primary-light)]",
  },
  success: {
    iconColor: "text-[var(--success)]",
    iconBg: "bg-[var(--success-light)]",
  },
  warning: {
    iconColor: "text-[var(--warning)]",
    iconBg: "bg-[var(--warning-light)]",
  },
};

const METRIC_VISUAL: Record<
  string,
  { icon: LucideIcon; accent: KpiAccent }
> = {
  appointments: { icon: Calendar, accent: "primary" },
  inquiries: { icon: UserPlus, accent: "success" },
  customers: { icon: Users, accent: "success" },
  processed: { icon: Inbox, accent: "warning" },
  completed: { icon: CheckCircle2, accent: "warning" },
  "voice-calls": { icon: Phone, accent: "primary" },
  "appointments-upcoming": { icon: Calendar, accent: "primary" },
  "appointments-scheduled": { icon: Calendar, accent: "primary" },
};

function resolveMetricVisual(metric: WorkdayKpiMetric) {
  const mapped = METRIC_VISUAL[metric.id];
  if (mapped) return mapped;

  const label = metric.label.toLowerCase();
  if (label.includes("kunde") || label.includes("interessent")) {
    return { icon: Users, accent: "success" as const };
  }
  if (label.includes("besichtigung") || label.includes("termin")) {
    return { icon: Calendar, accent: "primary" as const };
  }
  if (label.includes("vorgang") || label.includes("verarbeitet")) {
    return { icon: Inbox, accent: "warning" as const };
  }
  return { icon: TrendingUp, accent: "primary" as const };
}

function TrendIndicator({ metric }: { metric: WorkdayKpiMetric }) {
  if (metric.mode === "snapshot") {
    return (
      <p className="mt-2 text-[12px] font-medium text-[var(--text-muted)]">
        {metric.snapshotHint ?? "Aktueller Stand"}
      </p>
    );
  }

  const isUp = metric.trend === "up";
  const isDown = metric.trend === "down";
  const prefix = metric.changePercent > 0 ? "+" : "";

  return (
    <p
      className={cn(
        "mt-2 inline-flex items-center gap-1 text-[12px] font-semibold",
        isUp && "text-[var(--success)]",
        isDown && "text-[var(--danger)]",
        !isUp && !isDown && "text-[var(--text-muted)]"
      )}
    >
      {isUp ? (
        <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
      ) : isDown ? (
        <ArrowDownRight className="size-3.5" strokeWidth={2.5} />
      ) : null}
      {prefix}
      {metric.changePercent}%
      <span className="font-normal text-[var(--text-muted)]">vs. Vorwoche</span>
    </p>
  );
}

type StripeKpiTileProps = {
  metric: WorkdayKpiMetric;
  className?: string;
  style?: CSSProperties;
  animate?: boolean;
};

export function StripeKpiTile({
  metric,
  className,
  style,
  animate = true,
}: StripeKpiTileProps) {
  const { icon: Icon, accent } = resolveMetricVisual(metric);
  const styles = accentStyles[accent];

  return (
    <Card className={cn("helpy-fade-in-slide py-0", className)} style={style}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full",
              styles.iconBg
            )}
          >
            <Icon className={cn("size-5", styles.iconColor)} strokeWidth={2} />
          </div>
        </div>

        <div className="mt-4">
          {animate ? (
            <AnimatedNumber
              value={metric.current}
              className="text-[36px] font-extrabold leading-none tracking-[-0.03em] text-[var(--text-primary)]"
            />
          ) : (
            <p className="text-[36px] font-extrabold leading-none tracking-[-0.03em] text-[var(--text-primary)]">
              {metric.current}
            </p>
          )}
          <p className="mt-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
            {metric.label}
          </p>
          <TrendIndicator metric={metric} />
        </div>
      </CardContent>
    </Card>
  );
}
