"use client";

import { VorgangCard } from "@/features/workspace/components/vorgaenge/vorgang-card";
import { Card, CardContent } from "@/components/ui/card";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

type PreparedMailVorgaengeSectionProps = {
  vorgaenge: Vorgang[];
  emptyHint?: string | null;
  isLoading?: boolean;
};

function MetricSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-[20px] border border-[#CBD5E1]/30 bg-[#F8FAFC]/80"
        />
      ))}
    </div>
  );
}

export function PreparedMailVorgaengeSection({
  vorgaenge,
  emptyHint,
  isLoading = false,
}: PreparedMailVorgaengeSectionProps) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
          Von HELPY vorbereitet
        </h2>
        <p className="mt-1.5 text-sm text-[#64748B]">
          Von HELPY vorbereitet – bitte prüfen und bestätigen.
        </p>
      </div>

      <Card className="relative overflow-hidden rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#2563EB]/8 to-transparent" />
        <CardContent className="relative space-y-4 p-7 lg:p-8">
          {isLoading ? (
            <MetricSkeleton />
          ) : vorgaenge.length > 0 ? (
            <div className="space-y-4">
              {vorgaenge.map((vorgang) => (
                <VorgangCard key={vorgang.id} vorgang={vorgang} />
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] border border-[#CBD5E1]/40 bg-[#F8FAFC]/80 px-4 py-4">
              <p className="text-[13px] leading-relaxed text-[#64748B]">
                {emptyHint ?? "Noch keine echten Eingänge verarbeitet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
