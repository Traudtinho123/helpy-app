"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { BrainCircuit, Sparkles } from "lucide-react";
import {
  RecommendationCard,
  useActionExecution,
} from "@/components/helpy/RecommendationCard";
import { analyzeHelpyActions } from "@/features/brain/services/helpy-actions";
import { HELPY_PREPARED_LABEL } from "@/features/review/services/safety";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import { cn } from "@/lib/utils";

type ActionCardsContentProps = {
  vorgang: Vorgang;
  skill: HelpySkill;
  className?: string;
};

function ActionCardsContent({
  vorgang,
  skill,
  className,
}: ActionCardsContentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const { executeAction, getStatus } = useActionExecution();

  const analysis = useMemo(
    () => analyzeHelpyActions({ vorgang, skill }),
    [vorgang, skill]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsAnalyzing(false);
    }, 650);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-[16px] border border-[#BFDBFE]/50 bg-gradient-to-br from-[#EFF6FF]/80 to-white/60 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <BrainCircuit
              className="size-4 animate-pulse text-[#2563EB]"
              strokeWidth={2.25}
            />
          ) : (
            <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2.25} />
          )}
          <p className="text-[12px] font-semibold text-[#2563EB]">
            {isAnalyzing ? "HELPY analysiert den Vorgang…" : analysis.scenarioLabel}
          </p>
        </div>

        {!isAnalyzing && (
          <p className="helpy-fade-in mt-2 text-[11px] leading-relaxed text-[#64748B]">
            {HELPY_PREPARED_LABEL}
          </p>
        )}

        {!isAnalyzing && (
          <p className="helpy-fade-in mt-2 text-[12px] leading-relaxed text-[#334155]">
            {analysis.analysisText}
          </p>
        )}
      </div>

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
};

export const ActionCards = memo(function ActionCards({
  vorgang,
  skill,
  className,
}: ActionCardsProps) {
  return (
    <ActionCardsContent
      key={`${vorgang.id}-${skill}`}
      vorgang={vorgang}
      skill={skill}
      className={className}
    />
  );
});
