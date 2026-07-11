"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TelefoniePage } from "@/features/voice/components/telefonie-page";

export function TelefonieShell() {
  return (
    <DashboardShell activeHref="/telefonie">
      <TelefoniePage />
    </DashboardShell>
  );
}
