"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { IntakeFeedback, IntakeState } from "@/features/brain/services/intake";

type HelpyIntakePanelProps = {
  intake: IntakeState;
  feedback: IntakeFeedback | null;
  openingMessage: string | null;
};

export function HelpyIntakePanel({
  intake,
  feedback,
  openingMessage,
}: HelpyIntakePanelProps) {
  const isActive =
    intake.phase === "detecting" ||
    intake.phase === "waiting" ||
    intake.phase === "processing";
  const isReady = intake.phase === "ready";

  return (
    <div className="space-y-4">
      <div className="flex gap-3.5">
        <HelpyAvatar size="sm" pose={isActive ? "typing" : "idle"} />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[11px] font-semibold text-[#64748B]">
            {intake.panelTitle}
          </p>

          {isActive && (
            <>
              <div className="helpy-fade-in rounded-[20px] rounded-tl-[8px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/80 px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
                <p className="text-[13px] leading-[1.65] text-[#334155]">
                  {intake.panelMessage}
                </p>
              </div>
              <div className="flex items-center gap-2 px-1">
                <Loader2 className="size-3.5 animate-spin text-[#2563EB]" />
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="helpy-pulse-dot size-1.5 rounded-full bg-[#2563EB]"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {isReady && (
            <div className="helpy-fade-in space-y-3">
              <div className="rounded-[20px] rounded-tl-[8px] border border-[#BFDBFE]/60 bg-gradient-to-br from-[#EFF6FF] to-white px-5 py-5 shadow-[0_4px_20px_rgba(37,99,235,0.1)]">
                <p className="text-[13px] leading-[1.65] text-[#334155]">
                  {intake.panelMessage}
                </p>
              </div>
              <div className="rounded-[16px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 px-4 py-3.5">
                <div className="flex items-start gap-2">
                  <Sparkles
                    className="mt-0.5 size-4 shrink-0 text-[#2563EB]"
                    strokeWidth={2}
                  />
                  <p className="text-[12px] font-semibold leading-relaxed text-[#2563EB]">
                    {intake.panelRecommendation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {intake.phase === "monitoring" && (
            <div className="rounded-[20px] rounded-tl-[8px] border border-[#CBD5E1]/50 bg-[#F8FAFC] px-5 py-4">
              <p className="text-[13px] leading-[1.65] text-[#334155]">
                Ich starte die Erkennung und Vorbereitung…
              </p>
            </div>
          )}

          {intake.visibleDetectionIds.length > 0 && isActive && (
            <div className="rounded-[16px] border border-[#CBD5E1]/40 bg-white/90 p-4 shadow-sm">
              <ul className="space-y-2">
                {intake.detections
                  .filter((d) => intake.visibleDetectionIds.includes(d.id))
                  .map((detection) => (
                    <li
                      key={detection.id}
                      className="flex items-center gap-2.5 text-[12px] text-[#334155]"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5]">
                        <Check
                          className="size-3 text-[#059669]"
                          strokeWidth={2.5}
                        />
                      </span>
                      {detection.label}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {openingMessage && (
            <div className="helpy-fade-in rounded-[16px] border border-[#C4B5FD]/60 bg-[#F5F3FF]/80 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-[#7C3AED]" />
                <p className="text-[12px] font-medium text-[#5B21B6]">
                  {openingMessage}
                </p>
              </div>
            </div>
          )}

          {feedback && (
            <div className="helpy-fade-in rounded-[16px] border border-[#A7F3D0]/60 bg-[#ECFDF5]/80 px-4 py-3.5">
              <p className="text-[12px] leading-relaxed text-[#334155]">
                {feedback.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
