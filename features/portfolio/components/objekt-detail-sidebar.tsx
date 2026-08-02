"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  PenLine,
  Radio,
  Smartphone,
} from "lucide-react";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { Button } from "@/components/ui/button";
import { getDocumentDisplayStatus } from "@/features/documents/services/types";
import {
  fetchDeals,
  subscribeDeals,
} from "@/features/deals/services/deal-client-store";
import {
  DEAL_PHASES_VERKAUF,
  DEAL_PHASES_VERMIETUNG,
  type DealWithRelations,
} from "@/features/deals/types/deal-types";
import type { ObjektakteDetail } from "@/features/portfolio/types/objekt-portfolio-types";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";

type ObjektDetailSidebarProps = {
  detail: ObjektakteDetail;
  object: RealEstateObject;
  immoscoutConfigured: boolean | null;
  onPublish: () => void;
  onConnectImmoscout: () => void;
  onCreateExpose: () => void;
  onSocialPost: () => void;
  onOpenPipeline: () => void;
};

function resolvePipelineLabel(
  deals: DealWithRelations[],
  dealType: "verkauf" | "vermietung"
): string | null {
  if (deals.length === 0) return null;
  const phases =
    dealType === "vermietung" ? DEAL_PHASES_VERMIETUNG : DEAL_PHASES_VERKAUF;
  const lead = deals.reduce((best, deal) =>
    deal.phase > best.phase ? deal : best
  );
  const phaseMeta = phases.find((entry) => entry.phase === lead.phase);
  return phaseMeta
    ? `${phaseMeta.label} (${lead.phase}/9)`
    : `Phase ${lead.phase}/9`;
}

export function ObjektDetailSidebar({
  detail,
  object,
  immoscoutConfigured,
  onPublish,
  onConnectImmoscout,
  onCreateExpose,
  onSocialPost,
  onOpenPipeline,
}: ObjektDetailSidebarProps) {
  const dealType = object.transaktion === "Miete" ? "vermietung" : "verkauf";
  const [deals, setDeals] = useState<DealWithRelations[]>([]);

  const reloadDeals = useCallback(async () => {
    const all = await fetchDeals({ objekt_id: object.objectId });
    setDeals(all.filter((deal) => deal.objekt_id === object.objectId));
  }, [object.objectId]);

  useEffect(() => {
    void reloadDeals();
    return subscribeDeals(() => {
      void reloadDeals();
    });
  }, [reloadDeals]);

  const pipelineLabel = resolvePipelineLabel(deals, dealType);
  const matchHint =
    detail.interessenten.length > 0
      ? `${detail.interessenten.length} Interessent${detail.interessenten.length === 1 ? "" : "en"} passen zu diesem Objekt`
      : "HELPY sucht passende Interessenten…";

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center gap-3">
          <HelpyCharacter size={36} pose="idle" animated />
          <p className="text-[13px] font-bold tracking-wide text-[var(--text-accent)] uppercase">
            HELPY
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPipeline}
          className="mt-4 flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-left transition-colors hover:border-[var(--border-accent)]"
        >
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            {matchHint}
          </span>
          <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)]" />
        </button>
        {detail.helpyWissen.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {detail.helpyWissen.slice(0, 2).map((hint) => (
              <li
                key={hint}
                className="flex gap-2 text-[12px] leading-relaxed text-[var(--text-secondary)]"
              >
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--accent)]" />
                {hint}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <p className="text-[9px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase">
          Aktionen
        </p>
        <div className="mt-3 space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10 w-full justify-start gap-2 rounded-lg text-[13px]"
            onClick={onSocialPost}
          >
            <Smartphone className="size-4" />
            Social Post erstellen
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 w-full justify-start gap-2 rounded-lg text-[13px]"
            onClick={onCreateExpose}
          >
            <FileText className="size-4" />
            Exposé generieren
          </Button>
          {immoscoutConfigured === false ? (
            <Button
              type="button"
              variant="secondary"
              className="h-10 w-full justify-start gap-2 rounded-lg text-[13px]"
              onClick={onConnectImmoscout}
            >
              <Radio className="size-4" />
              ImmoScout24 verbinden
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="h-10 w-full justify-start gap-2 rounded-lg text-[13px]"
              onClick={onPublish}
            >
              <Radio className="size-4" />
              Portal publizieren
            </Button>
          )}
          {detail.dokumente.length > 0 ? (
            <Link
              href={`/dokumente?selected=${encodeURIComponent(detail.dokumente[0].id)}`}
              className="helpy-btn-secondary flex h-10 w-full items-center justify-start gap-2 rounded-lg px-4 text-[13px] font-semibold"
            >
              <PenLine className="size-4" />
              Zur Unterschrift
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <p className="text-[9px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase">
          Pipeline Status
        </p>
        <p className="mt-2 text-[14px] font-semibold text-[var(--text-primary)]">
          {pipelineLabel ?? "Noch keine Pipeline-Einträge"}
        </p>
        <button
          type="button"
          onClick={onOpenPipeline}
          className="mt-3 text-[12px] font-semibold text-[var(--text-accent)] hover:underline"
        >
          In Pipeline öffnen →
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <p className="text-[9px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase">
          Dokumente ({detail.dokumente.length})
        </p>
        {detail.dokumente.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {detail.dokumente.slice(0, 4).map((document) => (
              <li key={document.id}>
                <Link
                  href={`/dokumente?selected=${encodeURIComponent(document.id)}`}
                  className="block truncate text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-accent)]"
                >
                  {document.title}
                </Link>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {getDocumentDisplayStatus(document)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[12px] text-[var(--text-muted)]">
            Noch keine Dokumente
          </p>
        )}
      </div>
    </aside>
  );
}
