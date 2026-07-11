"use client";

import { Check, Loader2, Radar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { IntakeState } from "@/features/brain/services/intake";
import { cn } from "@/lib/utils";

type HelpyIntakeOverviewProps = {
  intake: IntakeState;
};

export function HelpyIntakeOverview({ intake }: HelpyIntakeOverviewProps) {
  const visibleDetections = intake.detections.filter((d) =>
    intake.visibleDetectionIds.includes(d.id)
  );
  const showSummary =
    intake.phase === "processing" || intake.phase === "ready";
  const isActive =
    intake.phase === "detecting" ||
    intake.phase === "waiting" ||
    intake.phase === "processing";

  if (visibleDetections.length === 0) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#2563EB]/8 to-transparent" />
      <CardContent className="relative p-7 lg:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-[14px] bg-[#EFF6FF]",
              isActive && "animate-pulse"
            )}
          >
            <Radar className="size-5 text-[#2563EB]" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[1.125rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
              Erkennung & Vorbereitung
            </h3>
            <p className="text-[12px] text-[#64748B]">
              {intake.phase === "waiting"
                ? "Vorgänge werden vorbereitet…"
                : "Neue Eingänge erkannt"}
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {visibleDetections.map((detection) => {
            const isLatest =
              detection.id ===
              visibleDetections[visibleDetections.length - 1]?.id;
            const stillRunning = isActive && isLatest;

            return (
              <li
                key={detection.id}
                className={cn(
                  "helpy-fade-in flex items-center gap-3 rounded-[14px] border px-4 py-3 transition-all duration-500",
                  stillRunning
                    ? "border-[#BFDBFE]/80 bg-[#EFF6FF]/80"
                    : "border-[#CBD5E1]/30 bg-[#F8FAFC]/80"
                )}
              >
                {stillRunning ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-[#2563EB]" />
                ) : (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5]">
                    <Check
                      className="size-3 text-[#059669]"
                      strokeWidth={2.5}
                    />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#0F172A]">
                    {detection.label}
                  </p>
                  <p className="truncate text-[11px] text-[#64748B]">
                    {detection.source}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {showSummary && (
          <div className="helpy-fade-in mt-6 border-t border-[#CBD5E1]/40 pt-6">
            <p className="mb-4 text-[13px] font-medium text-[#475569]">
              Daraus hat HELPY folgende Vorgänge vorbereitet:
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {intake.summary.map(({ typ, label, count }) => (
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
      </CardContent>
    </Card>
  );
}
