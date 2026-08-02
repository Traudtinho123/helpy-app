"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { BrainCircuit, Sparkles } from "lucide-react";
import { RecommendationCard } from "@/components/helpy/RecommendationCard";
import { analyzeHelpyActions, useHelpyActionExecutor } from "@/features/brain/services/helpy-actions";
import { VorgangMiniAppointmentPanel } from "@/features/workspace/components/vorgaenge/vorgang-mini-appointment-panel";
import { VorgangMiniReplyPanel } from "@/features/workspace/components/vorgaenge/vorgang-mini-reply-panel";
import { HELPY_PREPARED_LABEL } from "@/features/review/services/safety";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import { cn } from "@/lib/utils";

type ActionCardsContentProps = {
  vorgang: Vorgang;
  skill: HelpySkill;
  className?: string;
  onOpenWorkflow?: () => void;
  onOpenReplyReview?: () => void;
  onOpenAppointmentReview?: () => void;
  routeAddressHint?: string | null;
  phoneHint?: string | null;
};

function applyActionHints(
  actions: ReturnType<typeof analyzeHelpyActions>["actions"],
  hints: { routeAddressHint?: string | null; phoneHint?: string | null }
) {
  const { routeAddressHint, phoneHint } = hints;
  if (!routeAddressHint && !phoneHint) return actions;

  return actions.map((action) => {
    if (
      action.executionKind === "route" &&
      action.disabled &&
      routeAddressHint?.trim()
    ) {
      return {
        ...action,
        disabled: false,
        disabledReason: undefined,
        routeAddress: routeAddressHint.trim(),
      };
    }

    if (
      action.executionKind === "call" &&
      action.disabled &&
      phoneHint?.trim()
    ) {
      return {
        ...action,
        disabled: false,
        disabledReason: undefined,
        phoneNumber: phoneHint.trim(),
      };
    }

    return action;
  });
}

function ActionCardsContent({
  vorgang,
  skill,
  className,
  onOpenWorkflow,
  onOpenReplyReview,
  onOpenAppointmentReview,
  routeAddressHint,
  phoneHint,
}: ActionCardsContentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  const analysis = useMemo(() => {
    const base = analyzeHelpyActions({ vorgang, skill });
    return {
      ...base,
      actions: applyActionHints(base.actions, { routeAddressHint, phoneHint }),
    };
  }, [phoneHint, routeAddressHint, vorgang, skill]);

  const {
    executeAction,
    getStatus,
    inlinePanel,
    setInlinePanel,
    feedback,
    listeVorgang,
  } = useHelpyActionExecutor({
    vorgang,
    onOpenWorkflow,
    onOpenReplyReview,
    onOpenAppointmentReview,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsAnalyzing(false);
    }, 650);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-[16px] border border-[var(--border-accent)]/50 bg-gradient-to-br from-[#EFF6FF]/80 to-white/60 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <BrainCircuit
              className="size-4 animate-pulse text-[var(--accent)]"
              strokeWidth={2.25}
            />
          ) : (
            <Sparkles className="size-4 text-[var(--accent)]" strokeWidth={2.25} />
          )}
          <p className="text-[12px] font-semibold text-[var(--accent)]">
            {isAnalyzing ? "HELPY analysiert den Vorgang…" : analysis.scenarioLabel}
          </p>
        </div>

        {!isAnalyzing && (
          <p className="helpy-fade-in mt-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            {HELPY_PREPARED_LABEL}
          </p>
        )}

        {!isAnalyzing && (
          <p className="helpy-fade-in mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {analysis.analysisText}
          </p>
        )}
      </div>

      {!isAnalyzing && inlinePanel === "reply" ? (
        <VorgangMiniReplyPanel
          vorgang={listeVorgang}
          onClose={() => setInlinePanel("none")}
          onDone={() => setInlinePanel("none")}
        />
      ) : null}

      {!isAnalyzing && inlinePanel === "appointment" ? (
        <VorgangMiniAppointmentPanel
          vorgang={listeVorgang}
          onClose={() => setInlinePanel("none")}
          onDone={() => setInlinePanel("none")}
        />
      ) : null}

      {feedback ? (
        <p className="rounded-[12px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#047857]">
          {feedback}
        </p>
      ) : null}

      {!isAnalyzing && (
        <div className="space-y-3">
          {analysis.actions.map((action, index) => (
            <div
              key={action.id}
              className="helpy-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <RecommendationCard
                action={action}
                status={getStatus(action.id)}
                onExecute={executeAction}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ActionCardsProps = {
  vorgang: Vorgang;
  skill: HelpySkill;
  className?: string;
  onOpenWorkflow?: () => void;
  onOpenReplyReview?: () => void;
  onOpenAppointmentReview?: () => void;
  routeAddressHint?: string | null;
  phoneHint?: string | null;
};

export const ActionCards = memo(function ActionCards({
  vorgang,
  skill,
  className,
  onOpenWorkflow,
  onOpenReplyReview,
  onOpenAppointmentReview,
  routeAddressHint,
  phoneHint,
}: ActionCardsProps) {
  return (
    <ActionCardsContent
      key={`${vorgang.id}-${skill}`}
      vorgang={vorgang}
      skill={skill}
      className={className}
      onOpenWorkflow={onOpenWorkflow}
      onOpenReplyReview={onOpenReplyReview}
      onOpenAppointmentReview={onOpenAppointmentReview}
      routeAddressHint={routeAddressHint}
      phoneHint={phoneHint}
    />
  );
});
