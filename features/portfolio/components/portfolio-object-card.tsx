"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HELPY_BUTTON_OBJEKT_OEFFNEN } from "@/features/real-estate/object/object-types";
import { ObjectImageCover } from "@/features/portfolio/components/object-image-cover";
import { getObjektPath } from "@/features/portfolio/services/portfolio-service";
import type { PortfolioObjectSummary } from "@/features/portfolio/types/objekt-portfolio-types";
import { cn } from "@/lib/utils";

type PortfolioObjectCardProps = {
  summary: PortfolioObjectSummary;
};

export function PortfolioObjectCard({ summary }: PortfolioObjectCardProps) {
  return (
    <Card className="overflow-hidden rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-300 hover:border-[#BFDBFE]/60 hover:shadow-[0_4px_16px_rgba(37,99,235,0.08)]">
      <ObjectImageCover
        coverImageUrl={summary.coverImageUrl}
        alt={summary.titel}
        variant="card"
      />

      <CardContent className="space-y-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-semibold tracking-[-0.01em] text-[#0F172A]">
                {summary.titel}
              </p>
              <p className="mt-1 text-[13px] text-[#64748B]">{summary.adresse}</p>
              <p className="text-[13px] text-[#64748B]">
                {summary.plz} {summary.ort}
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]">
              <Building2 className="size-4" strokeWidth={2} />
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {summary.listingBadge && (
              <Badge
                variant="outline"
                className={cn(
                  "h-6 rounded-full px-2.5 text-[10px] font-semibold",
                  summary.listingBadge === "Miete"
                    ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
                )}
              >
                {summary.listingBadge}
              </Badge>
            )}
            <p className="text-[18px] font-semibold tracking-[-0.02em] text-[#0F172A]">
              {summary.preis}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]">
              Status: {summary.statusLabel}
            </span>
            <span className="text-[11px] text-[#94A3B8]">{summary.quelle}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[14px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-3 py-3">
          <Stat label="Interessenten" value={summary.interessentenCount} />
          <Stat label="Besichtigungen" value={summary.besichtigungenCount} />
          <Stat label="Dokumente" value={summary.dokumenteCount} />
        </div>

        <p className="text-[11px] text-[#94A3B8]">
          Letzte Aktivität: {summary.letzteAktivitaet}
        </p>

        <Link
          href={getObjektPath(summary.objectId)}
          className={cn(
            "inline-flex h-10 w-full items-center justify-center rounded-[12px] bg-[#2563EB] text-[12px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
          )}
        >
          {HELPY_BUTTON_OBJEKT_OEFFNEN}
        </Link>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-[16px] font-semibold tabular-nums text-[#0F172A]">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-[#64748B]">{label}</p>
    </div>
  );
}
