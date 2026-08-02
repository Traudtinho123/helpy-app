"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AddObjectDialog } from "@/features/portfolio/components/add-object-dialog";
import {
  ObjekteToolbar,
  type ObjekteViewMode,
} from "@/features/portfolio/components/objekte-toolbar";
import { PortfolioObjectGrid } from "@/features/portfolio/components/portfolio-object-grid";
import { PortfolioObjectList } from "@/features/portfolio/components/portfolio-object-list";
import {
  filterPortfolioSummaries,
  getPortfolioFilterCounts,
  searchPortfolioSummaries,
  type PortfolioObjectFilter,
} from "@/features/portfolio/services/portfolio-filters";
import {
  getServerPortfolioSummariesSnapshot,
  getStablePortfolioSummariesSnapshot,
  subscribePortfolioStores,
} from "@/features/portfolio/services/portfolio-service";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import {
  SKILL_PORTFOLIO_DESCRIPTION,
  SKILL_PORTFOLIO_NAV,
} from "@/lib/navigation";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const noopSubscribe = (_listener: () => void) => () => {};

export function ObjektePage() {
  const { activeSkill } = useActiveSkill();
  const portfolioNav = SKILL_PORTFOLIO_NAV[activeSkill];
  const description = SKILL_PORTFOLIO_DESCRIPTION[activeSkill];
  const isRealEstate = activeSkill === "real-estate";
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PortfolioObjectFilter>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ObjekteViewMode>("grid");

  const revision = useStoreRevision(
    isRealEstate ? subscribePortfolioStores : noopSubscribe
  );

  const summaries = useMemo(() => {
    if (!isRealEstate) {
      return getServerPortfolioSummariesSnapshot();
    }
    return getStablePortfolioSummariesSnapshot();
  }, [isRealEstate, revision]);

  const filterCounts = useMemo(
    () => getPortfolioFilterCounts(summaries),
    [summaries]
  );

  const filteredSummaries = useMemo(() => {
    const byFilter = filterPortfolioSummaries(summaries, activeFilter);
    return searchPortfolioSummaries(byFilter, searchQuery);
  }, [activeFilter, searchQuery, summaries]);

  return (
    <DashboardShell activeHref="/objekte">
      {!isRealEstate ? (
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
          <header className="mb-8">
            <p className="text-[11px] font-bold tracking-[0.15em] text-[var(--text-accent)] uppercase">
              Portfolio
            </p>
            <h1 className="helpy-display mt-2 text-[2rem] font-semibold tracking-[-0.035em] text-[var(--text-primary)] lg:text-[2.25rem]">
              {portfolioNav.label}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          </header>

          <Card className="py-0">
            <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-[18px] bg-[var(--accent-light)] text-2xl shadow-[var(--shadow-accent)]">
                {portfolioNav.emoji}
              </span>
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                {portfolioNav.label} folgen in Kürze
              </p>
              <p className="max-w-md text-[13px] leading-relaxed text-[var(--text-secondary)]">
                Die Portfolio-Ansicht für deinen Skill wird vorbereitet.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <ObjekteToolbar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            filterCounts={filterCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAddObject={() => setAddDialogOpen(true)}
          />

          {summaries.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-8">
              <Card className="w-full max-w-lg py-0">
                <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                  <span className="flex size-14 items-center justify-center rounded-[18px] bg-[var(--accent-light)] text-2xl shadow-[var(--shadow-accent)]">
                    {portfolioNav.emoji}
                  </span>
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                    Noch keine {portfolioNav.label.toLowerCase()}
                  </p>
                  <p className="max-w-md text-[13px] leading-relaxed text-[var(--text-secondary)]">
                    HELPY erkennt Objekte automatisch aus Vorgängen und Plattform-Anfragen.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="size-4" strokeWidth={2.5} />
                    Objekt hinzufügen
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : viewMode === "grid" ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <PortfolioObjectGrid summaries={filteredSummaries} />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto py-4">
              <PortfolioObjectList summaries={filteredSummaries} />
            </div>
          )}
        </div>
      )}

      {isRealEstate && (
        <AddObjectDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          skill={activeSkill}
          onSaved={() => {
            setAddDialogOpen(false);
          }}
        />
      )}
    </DashboardShell>
  );
}
