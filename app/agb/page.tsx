import type { Metadata } from "next";
import { AgbContent } from "@/components/legal/agb-content";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "AGB | HELPY",
  description: "Allgemeine Geschäftsbedingungen für die Nutzung der HELPY SaaS-Plattform.",
};

export default function AgbPage() {
  return (
    <LegalPageShell
      title="Allgemeine Geschäftsbedingungen"
      subtitle="Bedingungen für die Nutzung der HELPY Plattform."
      lastUpdated="2. August 2026"
    >
      <AgbContent />
    </LegalPageShell>
  );
}
