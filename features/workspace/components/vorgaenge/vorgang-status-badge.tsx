"use client";

import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/StatusBadge";
import {
  HELPY_STATUS_LABELS,
  type HelpyVorgangStatus,
} from "@/features/workspace/services/status";

const VORGANG_STATUS_VARIANT: Record<HelpyVorgangStatus, StatusBadgeVariant> = {
  neu: "neu",
  "von-helpy-vorbereitet": "vorbereitet",
  "in-pruefung": "in-pruefung",
  bestaetigt: "bestaetigt",
  erledigt: "erledigt",
  "wartet-auf-rueckmeldung": "niedrig",
};

type VorgangStatusBadgeProps = {
  status: HelpyVorgangStatus;
  className?: string;
};

export function VorgangStatusBadge({ status, className }: VorgangStatusBadgeProps) {
  return (
    <StatusBadge
      variant={VORGANG_STATUS_VARIANT[status]}
      label={HELPY_STATUS_LABELS[status]}
      className={className}
    />
  );
}
