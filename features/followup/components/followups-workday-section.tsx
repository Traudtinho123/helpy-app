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

export function FollowupsWorkdaySection() {
  const { items, hasOpenFollowUps } = useOpenFollowUps();

  useEffect(() => {
    refreshAllFollowUps();
  }, []);

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#EFF6FF]">
          <Clock className="size-5 text-[#2563EB]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
            Follow-ups
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Offene Kundenkommunikation — älteste zuerst
          </p>
        </div>
      </div>

      {!hasOpenFollowUps ? (
        <p className="text-[13px] text-[#64748B]">
          Aktuell keine offenen Follow-ups.
        </p>
      ) : (
        <ul className="space-y-3">
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
                      className="h-5 rounded-full border-[#BFDBFE]/60 bg-[#EFF6FF]/80 px-2 text-[10px] font-semibold text-[#2563EB]"
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

                  {followUp.preparedAction && (
                    <p className="text-[12px] font-medium text-[#334155]">
                      Empfohlene Aktion: {followUp.preparedAction.label}
                    </p>
                  )}
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
      )}
    </section>
  );
}
