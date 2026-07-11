import {
  ArrowUpRight,
  Calendar,
  FileText,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: number;
  trend: string;
  icon: LucideIcon;
  accent: "blue" | "emerald" | "amber";
};

const accentStyles = {
  blue: {
    icon: "from-[#2563EB] to-[#1E40AF] shadow-[#2563EB]/30",
    iconBg: "bg-[#EFF6FF]",
    glow: "from-[#2563EB]/10 to-transparent",
    badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
    value: "text-[#2563EB]",
  },
  emerald: {
    icon: "from-[#10B981] to-[#047857] shadow-[#10B981]/30",
    iconBg: "bg-[#ECFDF5]",
    glow: "from-[#10B981]/10 to-transparent",
    badge: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
    value: "text-[#059669]",
  },
  amber: {
    icon: "from-[#F59E0B] to-[#B45309] shadow-[#F59E0B]/30",
    iconBg: "bg-[#FFFBEB]",
    glow: "from-[#F59E0B]/10 to-transparent",
    badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
    value: "text-[#D97706]",
  },
} as const;

function KpiCard({ label, value, trend, icon: Icon, accent }: KpiCardProps) {
  const styles = accentStyles[accent];

  return (
    <Card
      className="group relative overflow-hidden rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08),0_24px_56px_rgba(37,99,235,0.08)]"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          styles.glow
        )}
      />
      <CardContent className="relative p-7">
        <div className="mb-5 flex items-start justify-between">
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-[18px] bg-gradient-to-br shadow-xl transition-transform duration-500 ease-out group-hover:scale-110",
              styles.icon
            )}
          >
            <Icon className="size-7 text-white" strokeWidth={1.75} />
          </div>
          <Badge
            variant="outline"
            className={cn(
              "h-6 gap-0.5 rounded-full border px-2.5 text-[10px] font-bold",
              styles.badge
            )}
          >
            <ArrowUpRight className="size-3" strokeWidth={2.5} />
            {trend}
          </Badge>
        </div>
        <p
          className={cn(
            "text-[3rem] leading-none font-bold tracking-[-0.04em]",
            styles.value
          )}
        >
          {value}
        </p>
        <p className="mt-3 text-[14px] font-medium leading-snug tracking-[-0.01em] text-[#475569]">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

const kpis: KpiCardProps[] = [
  {
    label: "E-Mails analysiert",
    value: 18,
    trend: "+12 %",
    icon: Inbox,
    accent: "blue",
  },
  {
    label: "Termine erkannt",
    value: 4,
    trend: "+2",
    icon: Calendar,
    accent: "emerald",
  },
  {
    label: "Angebote vorbereitet",
    value: 2,
    trend: "Bereit",
    icon: FileText,
    accent: "amber",
  },
];

export function KpiCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
