import { SettingsShell } from "@/components/settings/settings-shell";
import { AnalyticsContent } from "@/components/analytics/analytics-content";

export default function AnalyticsSettingsPage() {
  return (
    <SettingsShell
      title="Analytics"
      description="Überblick über deine Produktivität — was HELPY für dich erledigt hat."
    >
      <AnalyticsContent />
    </SettingsShell>
  );
}
