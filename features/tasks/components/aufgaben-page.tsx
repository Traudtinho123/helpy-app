"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export function AufgabenPage() {
  return (
    <DashboardShell activeHref="/aufgaben">
      <div className="mx-auto max-w-4xl px-8 py-12 lg:px-12 lg:py-14">
        <header className="mb-10">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
            Fokus
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.035em] text-[#0F172A] lg:text-[2.25rem]">
            Aufgaben
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#64748B]">
            Deine persönlichen Aufgaben — vorbereitet und priorisiert von HELPY.
          </p>
        </header>

        <Card className="rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-[0_4px_20px_rgba(37,99,235,0.35)]">
              <CheckSquare className="size-6 text-white" strokeWidth={2} />
            </span>
            <p className="text-[15px] font-semibold text-[#0F172A]">
              Aufgaben folgen in Kürze
            </p>
            <p className="max-w-md text-[13px] leading-relaxed text-[#64748B]">
              Ich bereite deine Aufgabenliste vor — sortiert nach Priorität und
              Frist.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
