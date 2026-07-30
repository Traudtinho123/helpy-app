"use client";

import { useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import type { FinanzenKpis } from "@/features/finanzen/types/finanzen-types";
import { formatChf } from "@/features/finanzen/types/finanzen-types";
import { cn } from "@/lib/utils";

type ProvisionDashboardProps = {
  kpis: FinanzenKpis;
  onMonatszielChange: (value: number) => void;
};

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5",
        accent && "border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/20"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">
        {label}
      </p>
      <p className="mt-2 text-[24px] font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

export function ProvisionDashboard({
  kpis,
  onMonatszielChange,
}: ProvisionDashboardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftZiel, setDraftZiel] = useState(String(kpis.monatsziel || ""));
  const [saving, setSaving] = useState(false);

  const handleSaveZiel = async () => {
    const value = Math.max(0, parseFloat(draftZiel.replace(/[^\d.]/g, "")) || 0);
    setSaving(true);
    try {
      await fetch("/api/finanzen/monatsziel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monatsziel: value }),
      });
      onMonatszielChange(value);
      setSettingsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Verdient Total" value={formatChf(kpis.verdientTotal)} accent />
        <KpiCard label="Ausstehend" value={formatChf(kpis.ausstehend)} />
        <KpiCard label="Dieses Jahr" value={formatChf(kpis.diesesJahr)} />
        <KpiCard label="Diesen Monat" value={formatChf(kpis.diesenMonat)} />
      </div>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-[var(--color-ink)]">
              Monatsziel
            </p>
            <p className="text-[12px] text-[var(--color-ink-3)]">
              {formatChf(kpis.diesenMonat)} von {formatChf(kpis.monatsziel)} CHF
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setDraftZiel(String(kpis.monatsziel || ""));
              setSettingsOpen(true);
            }}
          >
            <Settings2 className="size-4" />
            Ziel setzen
          </Button>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] transition-all duration-500"
            style={{ width: `${Math.min(100, kpis.monatsFortschritt)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-ink-4)]">
          {kpis.monatsziel > 0
            ? `${Math.round(kpis.monatsFortschritt)} % erreicht`
            : "Noch kein Monatsziel definiert"}
        </p>
      </div>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Monatsziel festlegen"
        description="Zielprovision in CHF für den aktuellen Monat."
      >
        <div className="space-y-4">
          <Input
            value={draftZiel}
            onChange={(e) => setDraftZiel(e.target.value)}
            placeholder="50'000"
            className="h-10"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSettingsOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSaveZiel()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Speichern
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
