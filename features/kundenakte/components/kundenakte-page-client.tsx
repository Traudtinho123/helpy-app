"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { KundenakteFocusView } from "@/features/kundenakte/components/kundenakte-focus-view";
import { KundenakteHelpyKnowledgePanel } from "@/features/kundenakte/components/kundenakte-helpy-knowledge-panel";
import { useKundenakte } from "@/features/kundenakte/hooks/use-kundenakte";

type KundenaktePageClientProps = {
  vorgangId: string;
};

export function KundenaktePageClient({ vorgangId }: KundenaktePageClientProps) {
  const kundenakte = useKundenakte(vorgangId);

  return (
    <DashboardShell
      activeHref="/kunden"
      rightPanel={
        kundenakte ? (
          <KundenakteHelpyKnowledgePanel email={kundenakte.email} />
        ) : undefined
      }
    >
      <KundenakteFocusView vorgangId={vorgangId} />
    </DashboardShell>
  );
}
