"use client";

import { useMemo } from "react";
import { Brain } from "lucide-react";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import {
  getCustomerMemoryByEmail,
  subscribeCustomerIntelligenceMemory,
} from "@/features/intelligence";
import { FieldGrid } from "@/features/workspace/components/workspace-sections";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";

type KundenakteHelpyKnowledgePanelProps = {
  email: string;
};

function formatList(values: string[]): string {
  if (values.length === 0) return "Noch keine Angabe";
  return values.join(" · ");
}

export function KundenakteHelpyKnowledgePanel({
  email,
}: KundenakteHelpyKnowledgePanelProps) {
  const revision = useStoreRevision(subscribeCustomerIntelligenceMemory);

  const memory = useMemo(
    () => getCustomerMemoryByEmail(email),
    [email, revision]
  );

  const hasKnowledge = Boolean(
    memory?.budget ||
      memory?.preferences.length ||
      memory?.importantFacts.length ||
      memory?.communicationStyle
  );

  return (
    <HelpyPanelShell
      variant="helpy"
      className="h-full"
      subtitle="Weiß über diesen Kunden"
      deskCompact
    >
        {hasKnowledge ? (
          <div className="rounded-[16px] border border-[#E9D5FF]/50 bg-gradient-to-br from-[#FAF5FF]/80 to-white/90 px-4 py-3.5 shadow-[0_2px_12px_rgba(124,58,237,0.06)]">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="size-4 text-[#7C3AED]" strokeWidth={2} />
              <p className="text-[12px] font-semibold text-[#0F172A]">
                Aktueller Status
              </p>
            </div>
            <FieldGrid
              fields={[
                {
                  label: "Budget",
                  value: memory?.budget ?? "Noch keine Angabe",
                  highlight: Boolean(memory?.budget),
                },
                {
                  label: "Präferenzen",
                  value: formatList(memory?.preferences ?? []),
                },
                {
                  label: "Wünsche",
                  value: formatList(memory?.importantFacts ?? []),
                },
                {
                  label: "Kommunikationsstil",
                  value: memory?.communicationStyle ?? "Noch keine Angabe",
                },
              ]}
            />
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-[#CBD5E1]/60 bg-white/70 px-4 py-6 text-center">
            <Brain className="mx-auto size-5 text-[#94A3B8]" strokeWidth={2} />
            <p className="mt-3 text-[12px] leading-relaxed text-[#64748B]">
              HELPY sammelt Budget, Präferenzen und Wünsche aus E-Mails, Terminen
              und Angeboten — sobald neue Informationen erkannt werden.
            </p>
          </div>
        )}
    </HelpyPanelShell>
  );
}
