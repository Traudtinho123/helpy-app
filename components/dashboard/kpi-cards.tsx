"use client";

import {
  Calendar,
  FileText,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiAccent } from "@/components/dashboard/stripe-kpi-tile";
import { cn } from "@/lib/utils";

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
    <Card className="helpy-glass-card helpy-glass-card-interactive helpy-fade-in-slide py-0">
      <CardContent className="p-5">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-full",
            styles.iconBg
          )}
        >
          <Icon className={cn("size-5", styles.iconColor)} strokeWidth={2} />
        </div>

        <div className="mt-4">
          <AnimatedNumber
            value={value}
            className="text-[32px] font-extrabold leading-none tracking-[-0.03em] text-[var(--text-primary)]"
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
    label: "E-Mails analysiert",
    value: 18,
    trend: "+12 %",
    trendDirection: "up",
    icon: Inbox,
    accent: "warning",
  },
  {
    label: "Termine erkannt",
    value: 4,
    trend: "+2",
    trendDirection: "up",
    icon: Calendar,
    accent: "primary",
  },
  {
    label: "Angebote vorbereitet",
    value: 2,
    trend: "Bereit",
    trendDirection: "neutral",
    icon: FileText,
    accent: "success",
  },
];

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
