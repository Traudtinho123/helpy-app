"use client";

import {
  Calendar,
  ClipboardList,
  Phone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiAccent = "accent" | "success" | "warning" | "danger";

type KpiCardProps = {
  label: string;
  value: number;
  trend: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: LucideIcon;
  accent: KpiAccent;
};

const accentStyles: Record<
  KpiAccent,
  { iconColor: string; iconBg: string }
> = {
  accent: {
    iconColor: "text-[var(--accent)]",
    iconBg: "bg-[var(--accent-light)]",
  },
  success: {
    iconColor: "text-[var(--success)]",
    iconBg: "bg-[var(--success-light)]",
  },
  warning: {
    iconColor: "text-[var(--warning)]",
    iconBg: "bg-[var(--warning-light)]",
  },
  danger: {
    iconColor: "text-[var(--danger)]",
    iconBg: "bg-[var(--danger-light)]",
  },
};

function KpiCard({
  label,
  value,
  trend,
  trendDirection = "up",
  icon: Icon,
  accent,
}: KpiCardProps) {
  const styles = accentStyles[accent];

  return (
    <Card className="rounded-xl border-[var(--border)] bg-[var(--bg-surface)] py-0 transition-all duration-200 hover:border-[var(--border-accent)] hover:shadow-[var(--shadow-sm)]">
      <CardContent className="p-5">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            styles.iconBg
          )}
        >
          <Icon className={cn("size-[18px]", styles.iconColor)} strokeWidth={2} />
        </div>

        <div className="mt-4">
          <AnimatedNumber
            value={value}
            className="text-[36px] font-extrabold leading-none tracking-[-0.03em] text-[var(--text-primary)]"
          />
          <p className="mt-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-[12px] font-semibold",
              trendDirection === "up" && "text-[var(--success)]",
              trendDirection === "down" && "text-[var(--danger)]",
              trendDirection === "neutral" && "text-[var(--text-muted)]"
            )}
          >
            {trendDirection === "up" ? "↑ " : trendDirection === "down" ? "↓ " : ""}
            {trend}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const kpis: KpiCardProps[] = [
  {
    label: "Vorgänge",
    value: 49,
    trend: "+23%",
    trendDirection: "up",
    icon: ClipboardList,
    accent: "accent",
  },
  {
    label: "Besichtigungen",
    value: 7,
    trend: "+40%",
    trendDirection: "up",
    icon: Calendar,
    accent: "success",
  },
  {
    label: "Neue Kd.",
    value: 3,
    trend: "+100%",
    trendDirection: "up",
    icon: Users,
    accent: "warning",
  },
  {
    label: "Anrufe",
    value: 12,
    trend: "+20%",
    trendDirection: "up",
    icon: Phone,
    accent: "danger",
  },
];

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
