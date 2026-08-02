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

const STATUS_CLASS: Record<StatusBadgeVariant, string> = {
  neu: "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--text-accent)]",
  vorbereitet:
    "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--text-accent)]",
  "in-pruefung":
    "border-[var(--warning-light)] bg-[var(--warning-light)] text-[var(--warning)]",
  bestaetigt:
    "border-[var(--success-light)] bg-[var(--success-light)] text-[var(--success)]",
  erledigt:
    "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]",
  kritisch:
    "border-[var(--danger-light)] bg-[var(--danger-light)] text-[var(--danger)]",
  hoch: "border-[var(--warning-light)] bg-[var(--warning-light)] text-[var(--warning)]",
  mittel:
    "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--text-accent)]",
  niedrig:
    "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]",
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
