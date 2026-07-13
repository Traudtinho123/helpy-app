"use client";

import { useState } from "react";
import { SlideUpSheet } from "@/components/mobile/slide-up-sheet";
import { WorkdayAnalyticsDashboard } from "@/features/workday/components/workday-analytics-dashboard";
import { WorkdayMobileWeeklySnapshot } from "@/features/workday/components/workday-mobile-weekly-snapshot";
import type {
  WorkdayAnalytics,
  WorkdayKpiMetric,
} from "@/features/analytics/services/workday-analytics";

type WorkdayBerichtSectionProps = {
  analytics: WorkdayAnalytics | null;
  isLoading?: boolean;
  error?: string | null;
  extraKpis?: WorkdayKpiMetric[];
};

export function WorkdayBerichtSection({
  analytics,
  isLoading = false,
  error = null,
  extraKpis = [],
}: WorkdayBerichtSectionProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!analytics && !isLoading && !error) {
    return null;
  }

  return (
    <>
      <WorkdayMobileWeeklySnapshot
        analytics={analytics}
        extraKpis={extraKpis}
        isLoading={isLoading}
        onOpenDetails={() => setSheetOpen(true)}
      />

      <div className="charts-section hidden md:block">
        <WorkdayAnalyticsDashboard
          analytics={analytics}
          isLoading={isLoading}
          error={error}
          extraKpis={extraKpis}
        />
      </div>

      <SlideUpSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Wochenanalyse"
        maxHeight="90vh"
      >
        <div className="p-4 pb-8">
          <WorkdayAnalyticsDashboard
            analytics={analytics}
            isLoading={isLoading}
            error={error}
            extraKpis={extraKpis}
            forceShowCharts
          />
        </div>
      </SlideUpSheet>
    </>
  );
}
