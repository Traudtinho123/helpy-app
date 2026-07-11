import type { IntegrationHealth } from "@/features/integration-manager/types/integration-types";

export const INTEGRATION_HEALTH_LABELS: Record<IntegrationHealth, string> = {
  online: "Online",
  warnung: "Warnung",
  offline: "Offline",
};

export const INTEGRATION_HEALTH_STYLES: Record<
  IntegrationHealth,
  { badge: string; dot: string }
> = {
  online: {
    badge: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
    dot: "bg-[#10B981]",
  },
  warnung: {
    badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
    dot: "bg-[#F59E0B]",
  },
  offline: {
    badge: "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]",
    dot: "bg-[#94A3B8]",
  },
};

export function getIntegrationHealthLabel(health: IntegrationHealth): string {
  return INTEGRATION_HEALTH_LABELS[health];
}
