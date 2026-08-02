"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchPortalListing,
  refreshPortalStats,
} from "@/features/portal-publish/services/portal-client-store";
import type {
  ObjektPortalListing,
  PortalId,
} from "@/features/portal-publish/types/portal-publish-types";
import { PORTAL_LABELS } from "@/features/portal-publish/types/portal-publish-types";

type ObjectPortalPerformanceTabProps = {
  objectId: string;
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3">
      <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-secondary)] uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function PortalStatsBlock({
  portal,
  listing,
}: {
  portal: Extract<PortalId, "immoscout24" | "homegate">;
  listing: ObjektPortalListing | null;
}) {
  const stats = listing?.stats?.[portal];
  const status = listing?.portal_status?.[portal];

  return (
    <section className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
          {PORTAL_LABELS[portal]}
        </h3>
        <span className="text-[11px] text-[var(--text-secondary)]">
          {status?.status === "live"
            ? "Live"
            : status?.status === "nicht_konfiguriert"
              ? "API nicht konfiguriert"
              : "Nicht publiziert"}
        </span>
      </div>

      {stats?.available ? (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Aufrufe"
            value={stats.views != null ? String(stats.views) : "—"}
          />
          <StatCard
            label="Anfragen"
            value={stats.inquiries != null ? String(stats.inquiries) : "—"}
          />
          <StatCard
            label="Conversion"
            value={
              stats.conversion != null
                ? `${Math.round(stats.conversion * 100)} %`
                : "—"
            }
          />
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {stats?.message ??
            "Statistiken sind für dieses Portal noch nicht verfügbar. Sobald die Partner-API Kennzahlen liefert, erscheinen sie hier."}
        </p>
      )}
    </section>
  );
}

export function ObjectPortalPerformanceTab({
  objectId,
}: ObjectPortalPerformanceTabProps) {
  const [listing, setListing] = useState<ObjektPortalListing | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async (withStats = false) => {
    setLoading(true);
    const data = withStats
      ? await refreshPortalStats(objectId)
      : await fetchPortalListing(objectId);
    setListing(data.listing);
    setLoading(false);
  }, [objectId]);

  useEffect(() => {
    void reload(false);
  }, [reload]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-[var(--accent)]" />
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">
              Portal-Performance
            </h2>
          </div>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            Aufrufe, Anfragen und Conversion — sofern die Portal-API Kennzahlen
            bereitstellt.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void reload(true)}
          disabled={loading}
          className="h-9 rounded-[12px] text-[12px]"
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      <PortalStatsBlock portal="immoscout24" listing={listing} />
      <PortalStatsBlock portal="homegate" listing={listing} />
    </div>
  );
}
