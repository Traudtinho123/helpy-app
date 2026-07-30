"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Wallet } from "lucide-react";
import { useCompanyProfile } from "@/components/company";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
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

export function FinanzenPage() {
  const { profile } = useCompanyProfile();
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
    void reload();
  }, [reload]);

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

  return (
    <DashboardShell activeHref="/finanzen">
      <div className="helpy-page py-6 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[var(--color-primary)]">
              <Wallet className="size-5" />
              <span className="text-[var(--text-xs)] font-semibold uppercase tracking-[var(--tracking-wide)]">
                Finanzen
              </span>
            </div>
            <h1 className="helpy-display text-[var(--text-3xl)] font-semibold text-[var(--color-ink)]">
              Provisions-Tracking
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--text-base)] text-[var(--color-ink-3)]">
              Übersicht über verdiente und ausstehende Maklerprovisionen — Rechnungen und Export für Bexio/Excel.
            </p>
          </div>

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
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--color-ink-3)]">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Finanzen werden geladen…
          </div>
        ) : (
          <div className="space-y-8">
            {kpis ? (
              <ProvisionDashboard
                kpis={{ ...kpis, monatsziel }}
                onMonatszielChange={handleMonatszielChange}
              />
            ) : null}

            <NurturingRoiCard />

            <section>
              <h2 className="mb-4 text-[var(--text-lg)] font-semibold text-[var(--color-ink)]">
                Alle Provisionen
              </h2>
              <ProvisionList
                provisions={provisions}
                objektTitles={objektTitles}
                onRefresh={() => void reload()}
              />
            </section>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
