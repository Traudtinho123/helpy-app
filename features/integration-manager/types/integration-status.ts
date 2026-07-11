import type { IntegrationStatus } from "@/features/integration-manager/types/integration-types";

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  verbunden: "Verbunden",
  nicht_verbunden: "Nicht verbunden",
  verbindung_pruefen: "Verbindung prüfen",
  fehler: "Fehler",
  bald_verfuegbar: "Bald verfügbar",
};

export const INTEGRATION_STATUS_STYLES: Record<
  IntegrationStatus,
  { badge: string; dot: string }
> = {
  verbunden: {
    badge: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
    dot: "bg-[#10B981]",
  },
  nicht_verbunden: {
    badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
    dot: "bg-[#2563EB]",
  },
  verbindung_pruefen: {
    badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
    dot: "bg-[#F59E0B]",
  },
  fehler: {
    badge: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
    dot: "bg-[#EF4444]",
  },
  bald_verfuegbar: {
    badge: "border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]",
    dot: "bg-[#CBD5E1]",
  },
};

export function getIntegrationStatusLabel(status: IntegrationStatus): string {
  return INTEGRATION_STATUS_LABELS[status];
}
