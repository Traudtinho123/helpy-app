"use client";

import { useCallback, useEffect, useState } from "react";
import { DealPipelineBoard } from "@/features/deals/components/deal-pipeline-board";
import {
  fetchDeals,
  subscribeDeals,
} from "@/features/deals/services/deal-client-store";
import type { DealWithRelations } from "@/features/deals/types/deal-types";

type ObjectPipelineTabProps = {
  objectId: string;
  dealType?: "verkauf" | "vermietung";
};

export function ObjectPipelineTab({
  objectId,
  dealType = "verkauf",
}: ObjectPipelineTabProps) {
  const [deals, setDeals] = useState<DealWithRelations[]>([]);

  const reload = useCallback(async () => {
    const all = await fetchDeals({ objekt_id: objectId });
    setDeals(all.filter((deal) => deal.objekt_id === objectId));
  }, [objectId]);

  useEffect(() => {
    void reload();
    return subscribeDeals(() => {
      void reload();
    });
  }, [reload]);

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-sm)] text-[var(--color-ink-3)]">
        Pipeline für dieses Objekt — alle Interessenten und ihr aktueller Stand.
      </p>
      <DealPipelineBoard deals={deals} dealType={dealType} onDealsChange={() => void reload()} />
    </div>
  );
}
