"use client";

import { Inbox, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AutopilotRunState } from "@/features/brain/services/autopilot";
import { cn } from "@/lib/utils";

type HelpyOverviewCardProps = {
  autopilot: AutopilotRunState;
};

export function HelpyOverviewCard({ autopilot }: HelpyOverviewCardProps) {
  const isRunning = autopilot.status === "running";
  const isCompleted = autopilot.status === "completed";
  const scanProgress =
    autopilot.totalEmails > 0
      ? Math.round((autopilot.scannedCount / autopilot.totalEmails) * 100)
      : 0;

  if (autopilot.status === "idle") {
    return null;
  }

  return (
    <Card className="relative overflow-hidden rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#2563EB]/10 to-transparent" />
      <CardContent className="relative p-7 lg:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-[0_4px_20px_rgba(37,99,235,0.35)]",
              isRunning && "animate-pulse"
            )}
          >
            {isRunning ? (
              <Loader2 className="size-5 animate-spin text-white" />
            ) : (
              <Inbox className="size-5 text-white" strokeWidth={2} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#2563EB]">
              HELPY Übersicht
            </p>
            <h2 className="mt-1 text-[1.25rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
              {isRunning
                ? "Was gibt es Neues zu erledigen?"
                : `${autopilot.totalEmails} neue E-Mails erkannt`}
            </h2>
            {isRunning && (
              <p className="mt-1 text-[13px] text-[#64748B]">
                Prüfe E-Mails… {autopilot.scannedCount} von{" "}
                {autopilot.totalEmails}
              </p>
            )}
          </div>
          {isRunning && (
            <span className="flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-[10px] font-semibold text-[#2563EB]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2563EB] opacity-40" />
                <span className="relative inline-flex size-2 rounded-full bg-[#2563EB]" />
              </span>
              Live
            </span>
          )}
          {isCompleted && (
            <span className="rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-[10px] font-semibold text-[#047857]">
              Fertig
            </span>
          )}
        </div>

        {isRunning && autopilot.scannedCount < autopilot.totalEmails && (
          <div className="mb-6">
            <div className="relative h-2 overflow-hidden rounded-full bg-[#E2E8F0]/80">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {(isCompleted || autopilot.visibleVorgangIds.length > 0) && (
          <div className="helpy-fade-in">
            <p className="mb-4 text-[13px] font-medium text-[#475569]">
              Daraus hat HELPY folgende Vorgänge vorbereitet:
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {autopilot.summary.map(({ typ, label, count }) => (
                <li
                  key={typ}
                  className="flex items-center justify-between rounded-[14px] border border-[#CBD5E1]/40 bg-[#F8FAFC]/80 px-4 py-3 backdrop-blur-sm"
                >
                  <span className="text-[13px] font-medium text-[#64748B]">
                    {label}
                  </span>
                  <span className="text-[1.125rem] font-bold tabular-nums text-[#0F172A]">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isRunning && autopilot.visibleVorgangIds.length === 0 && (
          <div className="flex items-center gap-2 rounded-[14px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 px-4 py-3">
            <Sparkles className="size-4 text-[#2563EB]" />
            <p className="text-[13px] text-[#334155]">
              HELPY analysiert den Posteingang…
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
