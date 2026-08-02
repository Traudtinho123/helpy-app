"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dismissPendingExtraction,
  getPendingExtractionsForKunde,
  saveSuchprofil,
  subscribeMatchingStore,
} from "@/features/matching/services/match-client-store";
import type { PendingSuchprofilExtraction } from "@/features/matching/services/match-client-store";

type SuchprofilConfirmationBannerProps = {
  kundeId: string;
  onEdit?: () => void;
};

export function SuchprofilConfirmationBanner({
  kundeId,
  onEdit,
}: SuchprofilConfirmationBannerProps) {
  const [pending, setPending] = useState<PendingSuchprofilExtraction | null>(
    null
  );
  const [confirming, setConfirming] = useState(false);

  useEffect(
    () =>
      subscribeMatchingStore(() => {
        setPending(getPendingExtractionsForKunde(kundeId));
      }),
    [kundeId]
  );

  useEffect(() => {
    setPending(getPendingExtractionsForKunde(kundeId));
  }, [kundeId]);

  const handleConfirm = useCallback(async () => {
    if (!pending) return;
    setConfirming(true);
    const { extracted } = pending;
    await saveSuchprofil({
      kunde_id: kundeId,
      art: extracted.art ?? "mieten",
      objekttyp: extracted.objekttyp,
      zimmer_min: extracted.zimmer_min,
      zimmer_max: extracted.zimmer_max,
      flaeche_min: extracted.flaeche_min,
      flaeche_max: extracted.flaeche_max,
      preis_max: extracted.preis_max,
      lagen: extracted.lagen,
      muss_kriterien: extracted.muss_kriterien,
      auto_erkannt: true,
      aktiv: true,
    });
    dismissPendingExtraction(pending.id);
    setPending(null);
    setConfirming(false);
  }, [kundeId, pending]);

  const handleDismiss = useCallback(() => {
    if (!pending) return;
    dismissPendingExtraction(pending.id);
    setPending(null);
  }, [pending]);

  if (!pending) return null;

  const { extracted } = pending;
  const summaryParts: string[] = [];
  if (extracted.zimmer_min || extracted.zimmer_max) {
    summaryParts.push(
      `${extracted.zimmer_min ?? "?"}–${extracted.zimmer_max ?? "?"} Zimmer`
    );
  }
  if (extracted.lagen.length) summaryParts.push(extracted.lagen.join(" / "));
  if (extracted.preis_max) {
    summaryParts.push(
      `bis CHF ${extracted.preis_max.toLocaleString("de-CH")}`
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--border-accent)] bg-gradient-to-r from-[#EFF6FF]/90 to-white p-4 shadow-[0_2px_12px_rgba(37,99,235,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-[#2563EB]/10 text-[var(--accent)]">
          <Sparkles className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">
            HELPY hat ein Suchprofil erkannt
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {summaryParts.length
              ? summaryParts.join(" · ")
              : extracted.sourceText.slice(0, 120)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={confirming}
              className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white"
            >
              {confirming ? "Speichern…" : "Bestätigen"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleDismiss();
                onEdit?.();
              }}
              className="h-8 rounded-[10px] border-[var(--border)] px-3 text-[11px]"
            >
              Bearbeiten
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 px-3 text-[11px] text-[var(--text-secondary)]"
            >
              Verwerfen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
