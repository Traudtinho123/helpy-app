"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AddObjectDialog } from "@/features/portfolio/components/add-object-dialog";
import { ObjektakteView } from "@/features/portfolio/components/objektakte-view";
import { ObjektePicker } from "@/features/portfolio/components/objekte-picker";
import { ObjekteToolbar } from "@/features/portfolio/components/objekte-toolbar";
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
  const [initialObjectTab, setInitialObjectTab] = useState<"uebersicht" | "dossier">(
    "uebersicht"
  );
  const [activeFilter, setActiveFilter] = useState<PortfolioObjectFilter>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  /** Leer = Browse-Modus (volle Leiste). Gesetzt = Fokus-Modus (nur Dropdown). */
  const [selectedId, setSelectedId] = useState("");

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

  const hasSelection =
    selectedId !== "" && summaries.some((item) => item.objectId === selectedId);

  const selectedObjectId = hasSelection ? selectedId : "";

  /** Im Fokus-Modus alle Objekte im Dropdown; im Browse-Modus die gefilterte Liste. */
  const pickerSummaries = hasSelection
    ? [...summaries]
    : filteredSummaries;

  const handleFilterChange = (filter: PortfolioObjectFilter) => {
    setActiveFilter(filter);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectObject = (id: string) => {
    setSelectedId(id);
    setInitialObjectTab("uebersicht");
  };

  const handleBackToOverview = () => {
    setSelectedId("");
  };

  return (
    <DashboardShell activeHref="/objekte">
      {!isRealEstate ? (
        <div className="mx-auto max-w-5xl px-8 py-12 lg:px-12 lg:py-14">
          <header className="mb-10">
            <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
              Portfolio
            </p>
            <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.035em] text-[#0F172A] lg:text-[2.25rem]">
              {portfolioNav.label}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#64748B]">
              {description}
            </p>
          </header>

          <Card className="rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-2xl shadow-[0_4px_20px_rgba(37,99,235,0.35)]">
                {portfolioNav.emoji}
              </span>
              <p className="text-[15px] font-semibold text-[#0F172A]">
                {portfolioNav.label} folgen in Kürze
              </p>
              <p className="max-w-md text-[13px] leading-relaxed text-[#64748B]">
                Die Portfolio-Ansicht für deinen Skill wird vorbereitet.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          {summaries.length === 0 ? (
            <>
              <ObjekteToolbar
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                filterCounts={filterCounts}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onAddObject={() => setAddDialogOpen(true)}
              />
              <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-8">
                <Card className="w-full max-w-lg rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                    <span className="flex size-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-2xl shadow-[0_4px_20px_rgba(37,99,235,0.35)]">
                      {portfolioNav.emoji}
                    </span>
                    <p className="text-[15px] font-semibold text-[#0F172A]">
                      Noch keine {portfolioNav.label.toLowerCase()}
                    </p>
                    <p className="max-w-md text-[13px] leading-relaxed text-[#64748B]">
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
            </>
          ) : hasSelection ? (
            <>
              <ObjektePicker
                summaries={pickerSummaries}
                selectedId={selectedObjectId}
                onSelect={handleSelectObject}
                compact
                trailing={
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 gap-1.5 rounded-[10px] border-[#CBD5E1]/60 px-3 text-[12px] font-medium text-[#64748B]"
                    onClick={handleBackToOverview}
                  >
                    <LayoutGrid className="size-3.5" strokeWidth={2} />
                    Übersicht
                  </Button>
                }
              />
              <div className="min-h-0 flex-1 overflow-hidden">
                <ObjektakteView
                  objectId={selectedObjectId}
                  embedded
                  initialTab={initialObjectTab}
                />
              </div>
            </>
          ) : (
            <>
              <ObjekteToolbar
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                filterCounts={filterCounts}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onAddObject={() => setAddDialogOpen(true)}
              />
              <ObjektePicker
                summaries={pickerSummaries}
                selectedId=""
                onSelect={handleSelectObject}
                placeholderOption="Objekt wählen…"
              />
              <div className="flex min-h-0 flex-1 items-center justify-center bg-white/40 px-6">
                <p className="text-sm text-[#64748B]">
                  Wähle ein Objekt über die Suche, den Filter oder die Kartenleiste.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {isRealEstate && (
        <AddObjectDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          skill={activeSkill}
          onSaved={({ objectId, openDossierTab }) => {
            setSelectedId(objectId);
            setInitialObjectTab(openDossierTab ? "dossier" : "uebersicht");
          }}
        />
      )}
    </DashboardShell>
  );
}
