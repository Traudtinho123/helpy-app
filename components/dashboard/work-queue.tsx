import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QueueItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "amber" | "emerald" | "blue";
  priority: "Hoch" | "Mittel" | "Normal";
  time: string;
};

const queueItems: QueueItem[] = [
  {
    title: "Angebot wartet",
    description:
      "Herr Müller wartet auf ein Angebot — seit 3 Tagen überfällig.",
    icon: AlertCircle,
    accent: "amber",
    priority: "Hoch",
    time: "vor 3 T.",
  },
  {
    title: "Termin erkannt",
    description:
      "Dienstag 14:00 Uhr im E-Mail-Verlauf mit Schmidt GmbH vorgeschlagen.",
    icon: CalendarCheck,
    accent: "emerald",
    priority: "Mittel",
    time: "Heute",
  },
  {
    title: "E-Mail braucht Antwort",
    description:
      "Prioritätsnachricht von Weber & Co. erfordert deine Rückmeldung.",
    icon: Mail,
    accent: "blue",
    priority: "Normal",
    time: "vor 2 Std.",
  },
];

const accentStyles = {
  amber: {
    card: "hover:border-[#FDE68A]/60 hover:bg-[#FFFBEB]/40",
    icon: "from-[#F59E0B] to-[#D97706] shadow-[#F59E0B]/20",
    stripe: "bg-[#F59E0B]",
    badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  },
  emerald: {
    card: "hover:border-[#A7F3D0]/60 hover:bg-[#ECFDF5]/40",
    icon: "from-[#10B981] to-[#059669] shadow-[#10B981]/20",
    stripe: "bg-[#10B981]",
    badge: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  },
  blue: {
    card: "hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]/40",
    icon: "from-[#2563EB] to-[#1D4ED8] shadow-[#2563EB]/20",
    stripe: "bg-[#2563EB]",
    badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  },
} as const;

function WorkQueueCard({
  title,
  description,
  icon: Icon,
  accent,
  priority,
  time,
}: QueueItem) {
  const styles = accentStyles[accent];

  return (
    <Button
      variant="outline"
      className={cn(
        "group h-auto w-full justify-start gap-0 rounded-[24px] border-[#CBD5E1]/50 bg-white/90 p-0 text-left shadow-[0_2px_8px_rgba(15,23,42,0.04),0_4px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06),0_16px_40px_rgba(15,23,42,0.08)]",
        styles.card
      )}
    >
      <div className={cn("w-1 self-stretch rounded-l-[24px]", styles.stripe)} />
      <div className="flex flex-1 items-center gap-5 p-6">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br shadow-md transition-transform duration-500 ease-out group-hover:scale-105",
            styles.icon
          )}
        >
          <Icon className="size-5 text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <p className="font-medium tracking-[-0.01em] text-[#0F172A]">
              {title}
            </p>
            <Badge
              variant="outline"
              className={cn(
                "h-5 rounded-full px-2 text-[10px] font-semibold",
                styles.badge
              )}
            >
              {priority}
            </Badge>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <span className="text-[11px] font-medium text-[#94A3B8]">{time}</span>
          <span className="flex size-9 items-center justify-center rounded-[12px] bg-[#F1F5F9]/80 text-[#94A3B8] transition-all duration-300 group-hover:bg-[#0F172A] group-hover:text-white group-hover:shadow-md">
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Button>
  );
}

export function WorkQueue() {
  return (
    <section>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
            Heute wichtig
          </h2>
          <p className="mt-1.5 text-sm text-[#64748B]">
            Priorisierte Aufgaben für deinen Tag
          </p>
        </div>
        <Badge
          variant="secondary"
          className="h-7 rounded-full border-white/80 bg-white/60 px-3 text-xs font-medium text-[#64748B] backdrop-blur-sm"
        >
          {queueItems.length} Einträge
        </Badge>
      </div>

      <div className="space-y-4">
        {queueItems.map((item) => (
          <WorkQueueCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}
