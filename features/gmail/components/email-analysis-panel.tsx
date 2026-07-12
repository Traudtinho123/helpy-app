"use client";

import { useEffect, useState } from "react";
import {
  Check,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { HelpyIconBadge } from "@/components/helpy/helpy-icon-badge";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import { HelpyDetectedAppointment } from "@/features/gmail/components/helpy-detected-appointment";
import type { Email } from "@/features/gmail/mock/mock-emails";

type EmailAnalysisPanelProps = {
  email: Email | null;
};

const ANALYSIS_STEPS = [
  "Absender erkannt",
  "Unternehmen erkannt",
  "Frist erkannt",
  "Anliegen verstanden",
  "Antwort vorbereitet",
] as const;

const STEP_DELAY_MS = 450;

type ReplyState = "idle" | "loading" | "ready";

function getRecommendation(email: Email): string {
  return (
    email.analysis.recommendation ??
    `Ich würde diese Anfrage heute bearbeiten. ${email.analysis.summary}`
  );
}

function HelpyLiveStatus({
  visibleSteps,
  isWorking,
}: {
  visibleSteps: number;
  isWorking: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-[#CBD5E1]/40 bg-white/90 p-4 shadow-sm">
      {isWorking && (
        <div className="mb-3 flex items-center gap-2.5">
          <HelpyIconBadge size={16} pose="typing" />
          <span className="text-[12px] font-medium text-[#334155]">
            HELPY arbeitet gerade…
          </span>
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="helpy-pulse-dot size-1.5 rounded-full bg-[#2563EB]"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
        </div>
      )}

      <ul className="space-y-2">
        {ANALYSIS_STEPS.map((step, index) => {
          const isVisible = index < visibleSteps;
          if (!isVisible) return null;

          return (
            <li
              key={step}
              className="helpy-fade-in flex items-center gap-2.5 text-[12px] text-[#334155]"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5]">
                <Check className="size-3 text-[#059669]" strokeWidth={2.5} />
              </span>
              {step}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReplyOverlay({
  state,
  reply,
  onClose,
}: {
  state: ReplyState;
  reply: string;
  onClose: () => void;
}) {
  if (state === "idle") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-[#0F172A]/25 p-5 backdrop-blur-[2px] sm:items-center">
      <div className="w-full max-w-[320px] rounded-[20px] border border-[#CBD5E1]/40 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.18)]">
        {state === "loading" ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <Loader2 className="size-8 animate-spin text-[#2563EB]" />
            <p className="text-[13px] font-semibold text-[#0F172A]">
              HELPY erstellt gerade deine Antwort…
            </p>
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
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HelpyAvatar size="sm" />
              <p className="text-[13px] font-semibold text-[#0F172A]">
                Deine Antwort ist fertig
              </p>
            </div>
            <div className="rounded-[14px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 p-4">
              <p className="text-[12px] leading-[1.7] text-[#334155]">{reply}</p>
            </div>
            <Button
              onClick={onClose}
              className="h-10 w-full rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[13px] font-semibold text-white"
            >
              Verstanden
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmailAnalysisPanel({ email }: EmailAnalysisPanelProps) {
  if (!email) {
    return <EmailAnalysisPanelShell email={null} />;
  }

  return <EmailAnalysisPanelActive key={email.id} email={email} />;
}

function EmailAnalysisPanelActive({ email }: { email: Email }) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [replyState, setReplyState] = useState<ReplyState>("idle");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    ANALYSIS_STEPS.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleSteps(index + 1);
          if (index === ANALYSIS_STEPS.length - 1) {
            timers.push(setTimeout(() => setAnalysisComplete(true), 300));
          }
        }, (index + 1) * STEP_DELAY_MS)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (replyState !== "loading") return;

    const timer = setTimeout(() => setReplyState("ready"), 2000);
    return () => clearTimeout(timer);
  }, [replyState]);

  return (
    <EmailAnalysisPanelShell
      email={email}
      visibleSteps={visibleSteps}
      analysisComplete={analysisComplete}
      replyState={replyState}
      onReplyLoading={() => setReplyState("loading")}
      onReplyClose={() => setReplyState("idle")}
    />
  );
}

function EmailAnalysisPanelShell({
  email,
  visibleSteps = 0,
  analysisComplete = false,
  replyState = "idle",
  onReplyLoading,
  onReplyClose,
}: {
  email: Email | null;
  visibleSteps?: number;
  analysisComplete?: boolean;
  replyState?: ReplyState;
  onReplyLoading?: () => void;
  onReplyClose?: () => void;
}) {
  const isWorking = email !== null && !analysisComplete;
  const showContent = email !== null && analysisComplete;

  return (
    <>
      <ReplyOverlay
        state={replyState}
        reply={email?.analysis.suggestedReply ?? ""}
        onClose={onReplyClose ?? (() => undefined)}
      />

      <HelpyPanelShell
        variant="helpy"
        className="flex w-[380px]"
        footer={
          email?.analysis.suggestedReply && analysisComplete ? (
            <Button
              onClick={() => onReplyLoading?.()}
              disabled={!onReplyLoading}
              className="h-11 w-full gap-2 rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-sm font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition-all duration-300 hover:shadow-[0_6px_28px_rgba(37,99,235,0.45)]"
            >
              <Sparkles className="size-4" />
              Antwort mit HELPY erstellen
            </Button>
          ) : undefined
        }
      >
        {!email ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/80 p-8 text-center">
            <HelpyCharacter size={88} pose="wave" animated showLabel={false} />
            <p className="text-sm font-medium text-[#64748B]">
              Wähle eine E-Mail — ich analysiere sie für dich.
            </p>
          </div>
        ) : (
          <div className="space-y-5 px-1">
            <div className="helpy-fade-in">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
                Hallo Viktor 👋
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">
                Ich habe deine E-Mail bereits analysiert.
              </p>
            </div>

            <HelpyLiveStatus
              visibleSteps={visibleSteps}
              isWorking={isWorking}
            />

            {showContent && email.analysis.detectedAppointment && (
              <HelpyDetectedAppointment
                emailId={email.id}
                appointment={email.analysis.detectedAppointment}
              />
            )}

            {showContent && (
              <div className="space-y-5">
                <div className="helpy-fade-in rounded-[16px] border border-[#FDE68A]/60 bg-[#FFFBEB]/80 p-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="size-4 text-[#D97706]" strokeWidth={2} />
                    <p className="text-[12px] font-semibold text-[#B45309]">
                      Meine Empfehlung
                    </p>
                  </div>
                  <p className="mt-2.5 text-[12px] leading-[1.65] text-[#334155]">
                    {getRecommendation(email)}
                  </p>
                </div>

                {email.analysis.tasks.length > 0 && (
                  <div className="helpy-fade-in space-y-3">
                    <p className="text-[12px] font-semibold text-[#0F172A]">
                      Ich habe folgende Aufgaben erkannt
                    </p>
                    <ul className="space-y-2">
                      {email.analysis.tasks.map((task) => (
                        <li
                          key={task}
                          className="flex items-center gap-3 rounded-[12px] border border-[#CBD5E1]/40 bg-white px-3.5 py-2.5 shadow-sm"
                        >
                          <Square
                            className="size-4 shrink-0 text-[#94A3B8]"
                            strokeWidth={2}
                          />
                          <span className="text-[12px] font-medium text-[#334155]">
                            {task}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {email.analysis.offerDetail && (
                  <div className="helpy-fade-in space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-[#2563EB]" strokeWidth={2} />
                      <p className="text-[12px] font-semibold text-[#0F172A]">
                        Ich habe folgendes Angebot erkannt
                      </p>
                    </div>
                    <Card className="rounded-[16px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex justify-between gap-2 text-[12px]">
                          <span className="text-[#64748B]">Firmenname</span>
                          <span className="font-semibold text-[#0F172A]">
                            {email.analysis.offerDetail.company}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 text-[12px]">
                          <span className="text-[#64748B]">Angebotssumme</span>
                          <span className="font-semibold text-[#2563EB]">
                            {email.analysis.offerDetail.amount}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 text-[12px]">
                          <span className="text-[#64748B]">Deadline</span>
                          <Badge
                            variant="outline"
                            className="h-5 border-[#FECACA] bg-[#FEF2F2] text-[10px] font-semibold text-[#DC2626]"
                          >
                            {email.analysis.offerDetail.deadline}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {email.analysis.suggestedReply && (
                  <div className="helpy-fade-in space-y-3">
                    <p className="text-[12px] font-semibold text-[#0F172A]">
                      Ich habe bereits eine Antwort vorbereitet
                    </p>
                    <div className="rounded-[16px] border border-[#CBD5E1]/50 bg-gradient-to-br from-[#F8FAFC] to-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                      <div className="mb-3 flex items-center gap-2 border-b border-[#CBD5E1]/30 pb-3">
                        <HelpyAvatar size="sm" pose="typing" />
                        <div>
                          <p className="text-[11px] font-semibold text-[#0F172A]">
                            HELPY
                          </p>
                          <p className="text-[10px] text-[#94A3B8]">
                            Entwurf · {email.sender}
                          </p>
                        </div>
                      </div>
                      <p className="text-[12px] leading-[1.7] text-[#334155]">
                        {email.analysis.suggestedReply}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </HelpyPanelShell>
    </>
  );
}
