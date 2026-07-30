"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DealWithRelations } from "@/features/deals/types/deal-types";
import { formatChf } from "@/features/finanzen/types/finanzen-types";
import { fetchDeals } from "@/features/deals/services/deal-client-store";

type ProvisionModalProps = {
  deal: DealWithRelations | null;
  objektTitle?: string;
  open: boolean;
  onClose: () => void;
  onSaved?: (deal: DealWithRelations) => void;
};

export function ProvisionModal({
  deal,
  objektTitle,
  open,
  onClose,
  onSaved,
}: ProvisionModalProps) {
  const [verkaufspreis, setVerkaufspreis] = useState("");
  const [prozent, setProzent] = useState("");
  const [chf, setChf] = useState("");
  const [mwst, setMwst] = useState("0");
  const [useFixedChf, setUseFixedChf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deal || !open) return;
    setVerkaufspreis(
      deal.verkaufspreis_chf ? String(deal.verkaufspreis_chf) : ""
    );
    setProzent(deal.provision_prozent ? String(deal.provision_prozent) : "2");
    setChf(deal.provision_chf ? String(deal.provision_chf) : "");
    setMwst(
      deal.provision_mwst_prozent != null
        ? String(deal.provision_mwst_prozent)
        : "0"
    );
    setUseFixedChf(
      deal.provision_chf != null &&
        deal.provision_prozent == null &&
        deal.verkaufspreis_chf == null
    );
    setError(null);
  }, [deal, open]);

  const verkaufspreisNum = parseFloat(verkaufspreis.replace(/[^\d.]/g, "")) || 0;
  const prozentNum = parseFloat(prozent.replace(",", ".")) || 0;
  const mwstNum = parseFloat(mwst.replace(",", ".")) || 0;

  const calculatedChf =
    !useFixedChf && verkaufspreisNum > 0 && prozentNum > 0
      ? Math.round(verkaufspreisNum * (prozentNum / 100))
      : parseFloat(chf.replace(/[^\d.]/g, "")) || 0;

  const handleSave = useCallback(async () => {
    if (!deal) return;
    if (calculatedChf <= 0) {
      setError("Bitte Provision angeben.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verkaufspreis_chf: verkaufspreisNum || null,
          provision_prozent: useFixedChf ? null : prozentNum || null,
          provision_chf: calculatedChf,
          provision_mwst_prozent: mwstNum,
        }),
      });

      if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(detail?.error ?? "Speichern fehlgeschlagen.");
      }

      const data = (await response.json()) as { deal?: DealWithRelations };
      if (data.deal) {
        await fetchDeals();
        onSaved?.(data.deal);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }, [
    calculatedChf,
    deal,
    mwstNum,
    onClose,
    onSaved,
    prozentNum,
    useFixedChf,
    verkaufspreisNum,
  ]);

  if (!deal) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Provision erfassen"
      description={
        objektTitle
          ? `${objektTitle} — ${deal.kunde_name ?? "Interessent"}`
          : undefined
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="button" disabled={saving} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Speichern
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-[var(--color-ink-3)]">
            Verkaufspreis (CHF)
          </label>
          <Input
            value={verkaufspreis}
            onChange={(e) => setVerkaufspreis(e.target.value)}
            placeholder="820'000"
            className="h-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={!useFixedChf ? "primary" : "secondary"}
            onClick={() => setUseFixedChf(false)}
          >
            Prozent
          </Button>
          <Button
            type="button"
            size="sm"
            variant={useFixedChf ? "primary" : "secondary"}
            onClick={() => setUseFixedChf(true)}
          >
            Fixbetrag
          </Button>
        </div>

        {!useFixedChf ? (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--color-ink-3)]">
              Provision (%)
            </label>
            <Input
              value={prozent}
              onChange={(e) => setProzent(e.target.value)}
              placeholder="2"
              className="h-10"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--color-ink-3)]">
              Provision (CHF)
            </label>
            <Input
              value={chf}
              onChange={(e) => setChf(e.target.value)}
              placeholder="16'400"
              className="h-10"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-[var(--color-ink-3)]">
            MwSt. (%)
          </label>
          <Input
            value={mwst}
            onChange={(e) => setMwst(e.target.value)}
            placeholder="0"
            className="h-10"
          />
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-4)]">
            Berechnete Provision
          </p>
          <p className="mt-1 text-[18px] font-semibold text-[var(--color-ink)]">
            {!useFixedChf && prozentNum > 0 && verkaufspreisNum > 0
              ? `${prozentNum} % = ${formatChf(calculatedChf)}`
              : formatChf(calculatedChf)}
          </p>
          {mwstNum > 0 ? (
            <p className="mt-1 text-[12px] text-[var(--color-ink-3)]">
              inkl. MwSt.: {formatChf(Math.round(calculatedChf * (1 + mwstNum / 100)))}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="text-[12px] text-[var(--color-danger)]">{error}</p>
        ) : null}
      </div>
    </Modal>
  );
}
