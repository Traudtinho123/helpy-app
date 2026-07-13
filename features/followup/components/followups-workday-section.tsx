"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatFollowUpContactDate,
  getFollowUpStatusLabel,
  refreshAllFollowUps,
} from "@/features/followup/services/followup-engine";
import { useOpenFollowUps } from "@/features/followup/hooks/use-followup";
import { cn } from "@/lib/utils";

const MOBILE_PREVIEW_COUNT = 3;

export function FollowupsWorkdaySection() {
  const { items, hasOpenFollowUps } = useOpenFollowUps();

  useEffect(() => {
    refreshAllFollowUps();
  }, []);

  const previewItems = items.slice(0, MOBILE_PREVIEW_COUNT);
  const hasMore = items.length > MOBILE_PREVIEW_COUNT;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#EFF6FF]">
            <Clock className="size-5 text-[#2563EB]" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[1.2rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
              Follow-ups
            </h2>
            <p className="mt-0.5 text-[12px] text-[#64748B]">
              Offene Kundenkommunikation — älteste zuerst
            </p>
          </div>
        </div>
        {hasMore ? (
          <Link href="/vorgaenge" className="text-[12px] font-semibold text-[#2563EB]">
            Alle Follow-ups
          </Link>
        ) : null}
      </div>

      {!hasOpenFollowUps ? (
        <p className="text-[13px] text-[#64748B]">
          Aktuell keine offenen Follow-ups.
        </p>
      ) : (
        <>
          <ul className="space-y-1.5 md:hidden">
            {previewItems.map((followUp) => (
              <li key={followUp.id}>
                <Link
                  href={followUp.href}
                  className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E2E8F0]/80 bg-white px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full bg-[#2563EB]" />
                    <span className="truncate text-[13px] text-[#0F172A]">
                      {followUp.customerName}
                    </span>
                    <span className="shrink-0 text-[11px] text-[#94A3B8]">
                      · {followUp.daysWithoutAnswer} Tage
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-[#2563EB]">
                    Nachfassen →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <ul className="hidden space-y-3 md:block">
            {items.map((followUp) => (
              <li
                key={followUp.id}
                className="rounded-[20px] border border-[#CBD5E1]/50 bg-white/90 px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-[#0F172A]">
                        {followUp.customerName}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 rounded-full border-[#BFDBFE]/60 bg-[#EFF6FF]/80 px-2 text-[10px] font-semibold text-[#2563EB]"
                        )}
                      >
                        {getFollowUpStatusLabel(followUp.status)}
                      </Badge>
                    </div>

                    <p className="text-[12px] text-[#64748B]">
                      Letzter Kontakt: {formatFollowUpContactDate(followUp.lastOutgoingMail)}
                      {followUp.daysWithoutAnswer > 0 &&
                        ` · ${followUp.daysWithoutAnswer} Tage ohne Antwort`}
                    </p>

                    <p className="text-[12px] leading-relaxed text-[#64748B]">
                      {followUp.recommendation}
                    </p>
                  </div>

                  <Link
                    href={followUp.href}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[12px] border border-[#CBD5E1]/60 bg-white/90 px-4 text-[12px] font-medium text-[#334155] transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]/40"
                  >
                    {followUp.preparedAction?.buttonLabel ?? "Prüfen"}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
