"use client";

import { useMemo } from "react";
import { computeHelpyPanelWaitHint } from "@/features/workspace/services/response-timer/response-timer-engine";
import { useVorgangResponseTimerInput } from "@/features/workspace/services/response-timer/use-vorgang-response-timer-input";
import { useResponseTimerTick } from "@/features/workspace/services/response-timer/use-response-timer-tick";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { cn } from "@/lib/utils";

type HelpyPanelResponseTimerHintProps = {
  listeVorgang: Vorgang | null | undefined;
  className?: string;
};

export function HelpyPanelResponseTimerHint({
  listeVorgang,
  className,
}: HelpyPanelResponseTimerHintProps) {
  const now = useResponseTimerTick();
  const timerInput = useVorgangResponseTimerInput(listeVorgang);

  const hint = useMemo(() => {
    if (!timerInput) return null;
    return computeHelpyPanelWaitHint({ ...timerInput, now });
  }, [timerInput, now]);

  if (!hint) return null;

  return (
    <p className={cn("mt-3 text-[12px] leading-relaxed", hint.textClassName, className)}>
      {hint.primaryLine}
      {hint.secondaryLine ? (
        <>
          <br />
          <span className="text-[11px]">{hint.secondaryLine}</span>
        </>
      ) : null}
    </p>
  );
}
