"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { AutopilotFeedback } from "@/features/brain/services/autopilot";
import type { HelpyWorkState } from "@/features/workflow/services/helpy-work";
import { cn } from "@/lib/utils";

type HelpyWorkPanelContentProps = {
  workState: HelpyWorkState;
  feedback: AutopilotFeedback | null;
  openingMessage: string | null;
  idleMessage?: string;
};

export function HelpyWorkPanelContent({
  workState,
  feedback,
  openingMessage,
  idleMessage,
}: HelpyWorkPanelContentProps) {
  const { status, workSteps, autopilot, buttonState } = workState;
  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const showAutopilot =
    autopilot.status === "running" || autopilot.status === "completed";
  const activeStep = workSteps.find((s) => s.status === "active");
  const completedWorkSteps = workSteps.filter((s) => s.status === "completed");

  if (status === "idle" && buttonState === "new_vorgaenge") {
    return (
      <div className="flex gap-3.5">
        <HelpyAvatar size="sm" pose="wave" />
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[11px] font-semibold text-[var(--text-secondary)]">
            HELPY · Bereit
          </p>
          <div className="rounded-[20px] rounded-tl-[8px] border border-[var(--border-accent)] bg-[var(--accent-light)] px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <p className="text-[13px] leading-[1.65] text-[var(--text-secondary)]">
              {idleMessage ??
                "Es warten neue E-Mails und Vorgänge auf dich. Starte mit „HELPY, let's work“, dann übernehme ich."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3.5">
        <HelpyAvatar size="sm" pose={isRunning ? "typing" : "idle"} />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
            HELPY · {isRunning ? "Live" : "Übersicht"}
          </p>

          {(isRunning || isCompleted) && completedWorkSteps.length > 0 && (
            <div className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm">
              {isRunning && (
                <div className="mb-3 flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin text-[var(--accent)]" />
                  <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                    {activeStep?.panelMessage ?? "HELPY aktualisiert…"}
                  </span>
                </div>
              )}
              <ul className="space-y-2">
                {workSteps.map((step) => {
                  if (step.status === "pending") return null;
                  return (
                    <li
                      key={step.id}
                      className="helpy-fade-in flex items-center gap-2.5 text-[12px] text-[var(--text-secondary)]"
                    >
                      {step.status === "active" ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-[var(--accent)]" />
                      ) : (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5]">
                          <Check
                            className="size-3 text-[#059669]"
                            strokeWidth={2.5}
                          />
                        </span>
                      )}
                      {step.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {showAutopilot && isRunning && autopilot.panelMessage && (
            <div className="helpy-fade-in rounded-[20px] rounded-tl-[8px] border border-[var(--border-accent)] bg-[var(--accent-light)] px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <p className="text-[13px] leading-[1.65] text-[var(--text-secondary)]">
                {autopilot.panelMessage}
              </p>
            </div>
          )}

          {showAutopilot && isCompleted && (
            <div className="helpy-fade-in space-y-3">
              <div className="rounded-[20px] rounded-tl-[8px] border border-[var(--border-accent)] bg-gradient-to-br from-[#EFF6FF] to-white px-5 py-5 shadow-[0_4px_20px_rgba(37,99,235,0.1)]">
                <p className="text-[13px] leading-[1.65] text-[var(--text-secondary)]">
                  {autopilot.panelMessage}
                </p>
              </div>
              <div className="rounded-[16px] border border-[var(--border-accent)] bg-[var(--accent-light)]/50 px-4 py-3.5">
                <div className="flex items-start gap-2">
                  <Sparkles
                    className="mt-0.5 size-4 shrink-0 text-[var(--accent)]"
                    strokeWidth={2}
                  />
                  <p className="text-[12px] font-semibold leading-relaxed text-[var(--accent)]">
                    {autopilot.panelRecommendation}
                  </p>
                </div>
              </div>
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
            <div
              className={cn(
                "helpy-fade-in rounded-[16px] border px-4 py-3.5",
                feedback.type === "erledigt"
                  ? "border-[#A7F3D0]/60 bg-[#ECFDF5]/80"
                  : "border-[var(--border-accent)] bg-[var(--accent-light)]"
              )}
            >
              <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {feedback.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
