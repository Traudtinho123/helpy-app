import { DataPrivacySettingsPanel } from "@/components/settings/data-privacy-settings-panel";
import { SettingsShell } from "@/components/settings/settings-shell";

export default function DatenschutzSettingsPage() {
  return (
    <SettingsShell
      title="Datenschutz"
      description="Transparenz zu Speicherort, Verarbeitung und Löschung deiner Daten."
    >
      <DataPrivacySettingsPanel />
    </SettingsShell>
  );
}
