"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, Wallet } from "lucide-react";
import { useCompanyProfile } from "@/components/company";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { DealPipelineContent } from "@/features/deals/components/deal-pipeline-page";
import { ProvisionDashboard } from "@/features/finanzen/components/provision-dashboard";
import { ProvisionList } from "@/features/finanzen/components/provision-list";
import { NurturingRoiCard } from "@/features/nurturing/components/nurturing-roi-card";
import {
  getMonatsziel,
  setMonatsziel,
} from "@/features/finanzen/services/finanzen-settings-store";
import type {
  FinanzenKpis,
  ProvisionRow,
} from "@/features/finanzen/types/finanzen-types";
import { computeProvisionKpis } from "@/features/finanzen/types/finanzen-types";
import { getStablePortfolioSummariesSnapshot } from "@/features/portfolio/services/portfolio-service";
import { cn } from "@/lib/utils";

const FINANZEN_TABS = [
  { id: "uebersicht", label: "Übersicht" },
  { id: "pipeline", label: "Pipeline" },
  { id: "provisionen", label: "Provisionen" },
  { id: "rechnungen", label: "Rechnungen" },
] as const;

type FinanzenTab = (typeof FINANZEN_TABS)[number]["id"];

function parseFinanzenTab(raw: string | null): FinanzenTab {
  if (
    raw === "pipeline" ||
    raw === "provisionen" ||
    raw === "rechnungen"
  ) {
    return raw;
  }
  return "uebersicht";
}

function FinanzenPageContent() {
  const { profile } = useCompanyProfile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = parseFinanzenTab(searchParams.get("tab"));

  const [provisions, setProvisions] = useState<ProvisionRow[]>([]);
  const [kpis, setKpis] = useState<FinanzenKpis | null>(null);
  const [monatsziel, setMonatszielState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const objektTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const summary of getStablePortfolioSummariesSnapshot()) {
      map.set(summary.objectId, summary.titel);
    }
    return map;
  }, [provisions.length]);

  const needsFinanceData =
    activeTab === "uebersicht" ||
    activeTab === "provisionen" ||
    activeTab === "rechnungen";

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const storedZiel = getMonatsziel(profile.companyId);
      setMonatszielState(storedZiel);

      const response = await fetch(
        `/api/finanzen?monatsziel=${storedZiel}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as {
        provisions?: ProvisionRow[];
        kpis?: FinanzenKpis;
      };

      const rows = (data.provisions ?? []).map((row) => ({
        ...row,
        objekt_title: objektTitles.get(row.objekt_id) ?? row.objekt_id,
      }));

      setProvisions(rows);
      setKpis(
        data.kpis ??
          computeProvisionKpis(rows, storedZiel)
      );
    } finally {
      setLoading(false);
    }
  }, [objektTitles, profile.companyId]);

  useEffect(() => {
    if (!needsFinanceData) return;
    void reload();
  }, [needsFinanceData, reload]);

  const setTab = useCallback(
    (tab: FinanzenTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "uebersicht") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleMonatszielChange = useCallback(
    (value: number) => {
      setMonatsziel(profile.companyId, value);
      setMonatszielState(value);
      const rows = provisions.map((row) => ({
        ...row,
        objekt_title: objektTitles.get(row.objekt_id) ?? row.objekt_id,
      }));
      setKpis(computeProvisionKpis(rows, value));
    },
    [objektTitles, profile.companyId, provisions]
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/finanzen/export");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `provisions-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, []);

  const showExport =
    activeTab === "uebersicht" ||
    activeTab === "provisionen" ||
    activeTab === "rechnungen";

  return (
    <div className="helpy-page py-6 lg:py-10">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[var(--color-primary)]">
            <Wallet className="size-5" />
            <span className="text-[var(--text-xs)] font-semibold uppercase tracking-[var(--tracking-wide)]">
              Finanzen
            </span>
          </div>
          <h1 className="helpy-display text-[var(--text-3xl)] font-semibold text-[var(--color-ink)]">
            Finanzen
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--text-base)] text-[var(--color-ink-3)]">
            Pipeline, Provisionen und Rechnungen — alles an einem Ort.
          </p>
        </div>

        {showExport ? (
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={() => void handleExport()}
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            CSV Export
          </Button>
        ) : null}
      </header>

      <div className="mb-8 flex flex-wrap gap-1.5">
        {FINANZEN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all",
              activeTab === tab.id
                ? "border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                : "border-transparent bg-[var(--color-surface)] text-[var(--color-ink-3)] hover:bg-[var(--color-bg-subtle)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "pipeline" ? (
        <DealPipelineContent embedded />
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--color-ink-3)]">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Finanzen werden geladen…
        </div>
      ) : activeTab === "provisionen" ? (
        <section>
          <h2 className="mb-4 text-[var(--text-lg)] font-semibold text-[var(--color-ink)]">
            Alle Provisionen
          </h2>
          <ProvisionList
            provisions={provisions}
            objektTitles={objektTitles}
            onRefresh={() => void reload()}
            mode="provisions"
          />
        </section>
      ) : activeTab === "rechnungen" ? (
        <section>
          <h2 className="mb-4 text-[var(--text-lg)] font-semibold text-[var(--color-ink)]">
            Rechnungen
          </h2>
          <p className="mb-4 text-[var(--text-sm)] text-[var(--color-ink-3)]">
            Verdiente Provisionen abrechnen und PDF erzeugen.
          </p>
          <ProvisionList
            provisions={provisions}
            objektTitles={objektTitles}
            onRefresh={() => void reload()}
            mode="invoices"
          />
        </section>
      ) : (
        <div className="space-y-8">
          {kpis ? (
            <ProvisionDashboard
              kpis={{ ...kpis, monatsziel }}
              onMonatszielChange={handleMonatszielChange}
            />
          ) : null}

          <NurturingRoiCard />
        </div>
      )}
    </div>
  );
}

export function FinanzenPage() {
  return (
    <DashboardShell activeHref="/finanzen">
      <Suspense fallback={null}>
        <FinanzenPageContent />
      </Suspense>
    </DashboardShell>
  );
}
