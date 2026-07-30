import type {
  DealPipelineAnalytics,
  DealWithRelations,
} from "@/features/deals/types/deal-types";

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

export function computeDealPipelineAnalytics(
  deals: DealWithRelations[]
): DealPipelineAnalytics {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const openDeals = deals.filter((deal) => deal.phase < 9);
  const closedThisMonth = deals.filter((deal) => {
    if (deal.phase < 9) return false;
    return new Date(deal.phase_updated_at) >= monthStart;
  });

  const totalOpenValueChf = openDeals.reduce(
    (sum, deal) => sum + (deal.provision_chf ?? 0),
    0
  );

  const conversionRates: DealPipelineAnalytics["conversionRates"] = [];
  for (let phase = 1; phase < 9; phase++) {
    const reached = deals.filter((deal) => deal.phase >= phase).length;
    const nextReached = deals.filter((deal) => deal.phase >= phase + 1).length;
    conversionRates.push({
      fromPhase: phase,
      toPhase: phase + 1,
      rate: reached > 0 ? Math.round((nextReached / reached) * 100) : 0,
    });
  }

  const avgDaysPerPhase: DealPipelineAnalytics["avgDaysPerPhase"] = [];
  for (let phase = 1; phase <= 9; phase++) {
    const inPhase = deals.filter((deal) => deal.phase === phase);
    if (inPhase.length === 0) {
      avgDaysPerPhase.push({ phase, avgDays: 0 });
      continue;
    }
    const totalDays = inPhase.reduce(
      (sum, deal) => sum + daysBetween(deal.phase_updated_at, deal.updated_at),
      0
    );
    avgDaysPerPhase.push({
      phase,
      avgDays: Math.round((totalDays / inPhase.length) * 10) / 10,
    });
  }

  return {
    openDeals: openDeals.length,
    closedThisMonth: closedThisMonth.length,
    totalOpenValueChf,
    conversionRates,
    avgDaysPerPhase,
  };
}
