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

export type KpiAccent = "accent" | "success" | "warning" | "danger";

export type KpiIconId = "vorgaenge" | "besichtigungen" | "neue-kunden" | "anrufe";

export type KpiCardItem = {
  id: string;
  label: string;
  value: number;
  trend: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: KpiIconId;
  accent: KpiAccent;
};

const KPI_ICONS: Record<KpiIconId, LucideIcon> = {
  vorgaenge: ClipboardList,
  besichtigungen: Calendar,
  "neue-kunden": Users,
  anrufe: Phone,
};

const accentStyles: Record<KpiAccent, { iconColor: string; iconBg: string }> = {
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

type KpiCardProps = KpiCardItem & {
  isLoading?: boolean;
};

function KpiCard({
  label,
  value,
  trend,
  trendDirection = "up",
  icon,
  accent,
  isLoading = false,
}: KpiCardProps) {
  const styles = accentStyles[accent];
  const Icon = KPI_ICONS[icon];

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
          {isLoading ? (
            <div className="h-9 w-16 animate-pulse rounded-md bg-[var(--bg-elevated)]" />
          ) : (
            <AnimatedNumber
              value={value}
              className="text-[36px] font-extrabold leading-none tracking-[-0.03em] text-[var(--text-primary)]"
            />
          )}
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

type KpiCardsProps = {
  items: KpiCardItem[];
  isLoading?: boolean;
  className?: string;
};

export function KpiCards({ items, isLoading = false, className }: KpiCardsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((kpi) => (
        <KpiCard key={kpi.id} {...kpi} isLoading={isLoading} />
      ))}
    </div>
  );
}
