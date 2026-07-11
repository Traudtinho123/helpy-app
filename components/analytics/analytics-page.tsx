"use client";

import { AnalyticsContent } from "@/components/analytics/analytics-content";
import { SettingsShell } from "@/components/settings/settings-shell";

/** @deprecated Use /einstellungen/analytics */
export function AnalyticsPage() {
  return (
    <SettingsShell
      title="Analytics"
      description="Überblick über deine Produktivität — was HELPY für dich erledigt hat."
    >
      <AnalyticsContent />
    </SettingsShell>
  );
}
