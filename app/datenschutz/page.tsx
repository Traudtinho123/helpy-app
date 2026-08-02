import type { Metadata } from "next";
import { DatenschutzContent } from "@/components/legal/datenschutz-content";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Datenschutz | HELPY",
  description:
    "Datenschutzerklärung von HELPY — Informationen zur Verarbeitung personenbezogener und Gmail-Daten.",
};

export default function DatenschutzPage() {
  return (
    <LegalPageShell
      title="Datenschutzerklärung"
      subtitle="Transparenz zur Verarbeitung personenbezogener Daten — insbesondere bei der Gmail-Anbindung."
      lastUpdated="2. August 2026"
    >
      <DatenschutzContent />
    </LegalPageShell>
  );
}
