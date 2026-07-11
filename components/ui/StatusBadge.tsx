import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | "neu"
  | "vorbereitet"
  | "in-pruefung"
  | "bestaetigt"
  | "erledigt"
  | "kritisch"
  | "hoch"
  | "mittel"
  | "niedrig";

const STATUS_LABELS: Record<StatusBadgeVariant, string> = {
  neu: "Neu",
  vorbereitet: "Vorbereitet",
  "in-pruefung": "In Prüfung",
  bestaetigt: "Bestätigt",
  erledigt: "Erledigt",
  kritisch: "Kritisch",
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

/** Tailwind braucht vollständige Klassen — fest codiert für JIT. */
const STATUS_CLASS: Record<StatusBadgeVariant, string> = {
  neu: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  vorbereitet: "border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]",
  "in-pruefung": "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  bestaetigt: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  erledigt: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
  kritisch: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  hoch: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  mittel: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  niedrig: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
};

type StatusBadgeProps = {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
};

function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-full px-3 text-[11px] font-semibold tracking-[-0.01em]",
        STATUS_CLASS[variant],
        className
      )}
    >
      {label ?? STATUS_LABELS[variant]}
    </Badge>
  );
}

export { StatusBadge, STATUS_LABELS, STATUS_CLASS };
