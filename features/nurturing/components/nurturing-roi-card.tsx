"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { NurturingRoiStats } from "@/features/nurturing";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function NurturingRoiCard() {
  const [stats, setStats] = useState<NurturingRoiStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/nurturing?stats=1", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { stats?: NurturingRoiStats }) => {
        if (!cancelled) setStats(data.stats ?? null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || (stats.sent === 0 && stats.prepared === 0)) {
    return null;
  }

  const items = [
    { label: "Gesendet", value: String(stats.sent) },
    { label: "Geöffnet", value: `${stats.opened} (${pct(stats.openRate)})` },
    {
      label: "Beantwortet",
      value: `${stats.replied} (${pct(stats.replyRate)})`,
    },
    { label: "Deals aus Nurturing", value: String(stats.dealsCreated) },
  ];

  return (
    <section className="rounded-[20px] border border-[#CBD5E1]/50 bg-white/90 p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#ECFDF5]">
          <TrendingUp className="size-5 text-[#047857]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-[1.05rem] font-semibold text-[#0F172A]">
            Nurturing ROI
          </h2>
          <p className="text-[12px] text-[#64748B]">
            Bestandskunden-Kampagnen — Öffnungen, Antworten, Folge-Deals
          </p>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <li
            key={item.label}
            className="rounded-[14px] border border-[#E2E8F0]/80 bg-[#F8FAFC]/80 px-3 py-3"
          >
            <p className="text-[11px] font-medium text-[#64748B]">
              {item.label}
            </p>
            <p className="mt-1 text-[18px] font-semibold tracking-tight text-[#0F172A]">
              {item.value}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
