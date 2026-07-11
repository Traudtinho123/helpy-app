"use client";

import { useEffect, useMemo } from "react";
import { Sparkles } from "lucide-react";
import {
  getCrmPipelineSnapshot,
  subscribeCrmPipeline,
  syncPipelineSignalsForVorgang,
} from "@/features/crm/pipeline/pipeline-engine";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";

type HelpyNextRecommendationProps = {
  vorgangId: string;
  listeVorgang?: ListeVorgang;
};

/** Nutzerfreundliche Empfehlung — interne Stufenlogik, ohne Pipeline-Begriffe. */
export function HelpyNextRecommendation({
  vorgangId,
  listeVorgang,
}: HelpyNextRecommendationProps) {
  useEffect(() => {
    syncPipelineSignalsForVorgang(vorgangId, listeVorgang);
  }, [listeVorgang, vorgangId]);

  const revision = useStoreRevision(subscribeCrmPipeline);

  const record = useMemo(
    () => getCrmPipelineSnapshot(vorgangId),
    [vorgangId, revision]
  );

  if (!record?.recommendationText) return null;

  return (
    <div className="rounded-[16px] border border-[#BFDBFE]/50 bg-gradient-to-br from-[#EFF6FF]/70 to-white/90 px-4 py-3.5 shadow-[0_2px_12px_rgba(37,99,235,0.06)]">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
        <p className="text-[12px] font-semibold text-[#0F172A]">
          Nächste Empfehlung
        </p>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
        {record.recommendationText}
      </p>
    </div>
  );
}
