"use client";

import { Building2 } from "lucide-react";
import { EntityBrowserPicker } from "@/components/entity-browser";
import { Badge } from "@/components/ui/badge";
import { ObjectImageCover } from "@/features/portfolio/components/object-image-cover";
import type { PortfolioObjectSummary } from "@/features/portfolio/types/objekt-portfolio-types";
import { cn } from "@/lib/utils";

type ObjektePickerProps = {
  summaries: PortfolioObjectSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
  trailing?: React.ReactNode;
  placeholderOption?: string;
};

function ObjectPickerCard({
  summary,
  isSelected,
  onSelect,
}: {
  summary: PortfolioObjectSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[16px] border text-left transition-all duration-300",
        isSelected
          ? "border-[#2563EB]/30 bg-white shadow-[0_2px_16px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]/15"
          : "border-[#CBD5E1]/40 bg-white/70 hover:border-[#CBD5E1]/60 hover:bg-white hover:shadow-sm"
      )}
    >
      <ObjectImageCover
        coverImageUrl={summary.coverImageUrl}
        alt={summary.titel}
        variant="card"
        className="h-24"
      />

      <div className="space-y-3 p-3.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
                {summary.titel}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-[#64748B]">
                {summary.adresse}
              </p>
              <p className="truncate text-[12px] text-[#64748B]">
                {summary.plz} {summary.ort}
              </p>
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#2563EB]">
              <Building2 className="size-3.5" strokeWidth={2} />
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {summary.listingBadge && (
              <Badge
                variant="outline"
                className={cn(
                  "h-5 rounded-full px-2 text-[10px] font-semibold",
                  summary.listingBadge === "Miete"
                    ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
                )}
              >
                {summary.listingBadge}
              </Badge>
            )}
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#0F172A]">
              {summary.preis}
            </p>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-semibold text-[#047857]">
              Status: {summary.statusLabel}
            </span>
            <span className="text-[10px] text-[#94A3B8]">{summary.quelle}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 rounded-[12px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-2 py-2">
          <Stat label="Interessenten" value={summary.interessentenCount} />
          <Stat label="Besichtigungen" value={summary.besichtigungenCount} />
          <Stat label="Dokumente" value={summary.dokumenteCount} />
        </div>

        <p className="text-[10px] text-[#94A3B8]">
          Letzte Aktivität: {summary.letzteAktivitaet}
        </p>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-[14px] font-semibold tabular-nums text-[#0F172A]">{value}</p>
      <p className="mt-0.5 text-[9px] leading-tight text-[#64748B]">{label}</p>
    </div>
  );
}

export function ObjektePicker({
  summaries,
  selectedId,
  onSelect,
  compact = false,
  trailing,
  placeholderOption,
}: ObjektePickerProps) {
  return (
    <EntityBrowserPicker
      items={summaries}
      selectedId={selectedId}
      onSelect={onSelect}
      getItemId={(summary) => summary.objectId}
      getOptionLabel={(summary) =>
        `${summary.titel} — ${summary.plz} ${summary.ort}`
      }
      title="Objekt auswählen"
      selectAriaLabel="Objekt auswählen"
      emptyTitle="Keine Objekte gefunden."
      emptyDescription="Suche oder Filter anpassen."
      compact={compact}
      trailing={trailing}
      placeholderOption={placeholderOption}
      renderCard={(summary, isSelected) => (
        <ObjectPickerCard
          summary={summary}
          isSelected={isSelected}
          onSelect={() => onSelect(summary.objectId)}
        />
      )}
    />
  );
}
