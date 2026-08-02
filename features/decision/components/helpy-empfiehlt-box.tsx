"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Lightbulb, ShieldCheck } from "lucide-react";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import {
  getHelpyDecision,
  getOrEvaluateHelpyDecision,
  subscribeHelpyDecision,
} from "@/features/decision/services/decision-engine";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import type { HelpyDecision } from "@/features/decision/types/decision-types";
import { recordReviewOpened } from "@/features/workspace/services/status";
import { getWorkspacePath } from "@/features/workspace/services/workspace";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { cn } from "@/lib/utils";

type HelpyEmpfiehltBoxProps = {
  vorgang: Vorgang;
  className?: string;
  showAction?: boolean;
};

function useHelpyDecision(vorgang: Vorgang): HelpyDecision | null {
  useEffect(() => {
    getOrEvaluateHelpyDecision(vorgang);
  }, [vorgang.id]);

  const revision = useStoreRevision(subscribeHelpyDecision);

  return useMemo(
    () => getHelpyDecision(vorgang.id),
    [vorgang.id, revision]
  );
}

export function HelpyEmpfiehltBox({
  vorgang,
  className,
  showAction = true,
}: HelpyEmpfiehltBoxProps) {
  const decision = useHelpyDecision(vorgang);

  if (!decision || shouldPrepareArchive(vorgang)) return null;

  return (
    <div
      className={cn(
        "rounded-[16px] border border-[var(--border-accent)] bg-gradient-to-br from-[#EFF6FF]/70 to-white/90 px-4 py-3.5 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.04em] text-[var(--accent)] uppercase">
            HELPY empfiehlt
          </p>

          <p className="mt-2 text-[13px] font-semibold text-[var(--text-primary)]">
            {decision.decisionTitle}
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
                Begründung
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {decision.reason}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
                Nächster bester Schritt
              </p>
              <p className="mt-1 text-[12px] font-medium text-[var(--text-primary)]">
                {decision.nextBestStep}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
                Von HELPY vorbereitet
              </p>
              <ul className="mt-2 space-y-1">
                {decision.preparedItems.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[11px] leading-relaxed text-[var(--text-secondary)]"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#2563EB]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {showAction && (
            <Link
              href={getWorkspacePath(vorgang.id)}
              onClick={() => recordReviewOpened(vorgang.id)}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 text-[12px] font-semibold text-white shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <ShieldCheck className="size-3.5" />
              {decision.confirmationLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function HelpyEmpfiehltBoxFromDecision({
  decision,
  vorgangId,
  className,
  showAction = true,
}: {
  decision: HelpyDecision;
  vorgangId: string;
  className?: string;
  showAction?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-[var(--border-accent)] bg-gradient-to-br from-[#EFF6FF]/70 to-white/90 px-4 py-3.5 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.04em] text-[var(--accent)] uppercase">
            HELPY empfiehlt
          </p>

          <p className="mt-2 text-[13px] font-semibold text-[var(--text-primary)]">
            {decision.decisionTitle}
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
                Begründung
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {decision.reason}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
                Nächster bester Schritt
              </p>
              <p className="mt-1 text-[12px] font-medium text-[var(--text-primary)]">
                {decision.nextBestStep}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
                Von HELPY vorbereitet
              </p>
              <ul className="mt-2 space-y-1">
                {decision.preparedItems.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[11px] leading-relaxed text-[var(--text-secondary)]"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#2563EB]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {showAction && (
            <Link
              href={getWorkspacePath(vorgangId)}
              onClick={() => recordReviewOpened(vorgangId)}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 text-[12px] font-semibold text-white shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <ShieldCheck className="size-3.5" />
              {decision.confirmationLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
