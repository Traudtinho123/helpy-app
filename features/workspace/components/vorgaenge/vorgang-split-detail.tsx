"use client";

import { HelpyEmpfiehltBox } from "@/features/decision/components/helpy-empfiehlt-box";
import { isConnectedMailVorgang } from "@/features/decision/services/decision-engine";
import { HelpyReplyDraftCard } from "@/features/reply-drafts/components/helpy-reply-draft-card";
import { HelpyAppointmentSuggestionCard } from "@/features/appointment-suggestions/components/helpy-appointment-suggestion-card";
import { HelpyArchiveCard } from "@/features/spam-handling/components/helpy-archive-card";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import { isPlatformRealEstateVorgang } from "@/features/brain/services/platform-email-detector";
import { VorgangStatusBadge } from "@/features/workspace/components/vorgaenge/vorgang-status-badge";
import { useVorgangStatus } from "@/features/workspace/services/status/use-vorgang-status";
import {
  VORGANG_PRIORITY_LABELS,
  type Vorgang,
} from "@/features/workspace/services/vorgaenge/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type VorgangSplitDetailProps = {
  vorgang: Vorgang;
  onClose: () => void;
  onCompleted?: (message: string, helpyPanelMessage: string) => void;
  className?: string;
  showHeader?: boolean;
};

const priorityStyles = {
  kritisch: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]",
  hoch: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  mittel: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  niedrig: "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
} as const;

export function VorgangSplitDetail({
  vorgang,
  onClose,
  onCompleted,
  className,
  showHeader = true,
}: VorgangSplitDetailProps) {
  const { currentStatus } = useVorgangStatus(vorgang);
  const isConnectedMail = isConnectedMailVorgang(vorgang);
  const isPlatformInquiry = isPlatformRealEstateVorgang(vorgang);
  const isArchiveCandidate = isConnectedMail && shouldPrepareArchive(vorgang);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)]/95 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      {showHeader ? (
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <VorgangStatusBadge status={currentStatus} />
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                priorityStyles[vorgang.prioritaet]
              )}
            >
              {VORGANG_PRIORITY_LABELS[vorgang.prioritaet]}
            </span>
          </div>
          <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {vorgang.titel}
          </h2>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            {vorgang.kunde} · {vorgang.receivedLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-[10px] p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          aria-label="Detail schliessen"
        >
          <X className="size-4" />
        </button>
      </header>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {vorgang.summary ? (
          <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
            {vorgang.summary}
          </p>
        ) : null}

        {vorgang.detectedContext && vorgang.detectedContext.length > 0 ? (
          <ul className="mt-4 space-y-1 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            {vorgang.detectedContext.map((line) => (
              <li key={line} className="text-[12px] text-[var(--text-secondary)]">
                {line}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 space-y-4">
          {isArchiveCandidate ? (
            <HelpyArchiveCard vorgang={vorgang} />
          ) : isPlatformInquiry || isConnectedMail ? (
            <>
              <HelpyEmpfiehltBox vorgang={vorgang} />
              <HelpyReplyDraftCard vorgang={vorgang} />
              <HelpyAppointmentSuggestionCard
                vorgang={vorgang}
                onConfirmed={(message) => {
                  onCompleted?.(message, message);
                }}
              />
            </>
          ) : (
            <div className="rounded-[14px] border border-[#FDE68A]/50 bg-[#FFFBEB]/50 px-4 py-3">
              <p className="text-[12px] text-[var(--text-secondary)]">{vorgang.helpyEmpfehlung}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
