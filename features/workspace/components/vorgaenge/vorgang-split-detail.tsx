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
};

const priorityStyles = {
  kritisch: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]",
  hoch: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  mittel: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  niedrig: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
} as const;

export function VorgangSplitDetail({
  vorgang,
  onClose,
  onCompleted,
  className,
}: VorgangSplitDetailProps) {
  const { currentStatus } = useVorgangStatus(vorgang);
  const isConnectedMail = isConnectedMailVorgang(vorgang);
  const isPlatformInquiry = isPlatformRealEstateVorgang(vorgang);
  const isArchiveCandidate = isConnectedMail && shouldPrepareArchive(vorgang);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#CBD5E1]/40 bg-white/95 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E2E8F0]/80 px-5 py-4">
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
          <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-[#0F172A]">
            {vorgang.titel}
          </h2>
          <p className="mt-1 text-[12px] text-[#64748B]">
            {vorgang.kunde} · {vorgang.receivedLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-[10px] p-2 text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          aria-label="Detail schliessen"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {vorgang.summary ? (
          <p className="text-[13px] leading-relaxed text-[#475569]">
            {vorgang.summary}
          </p>
        ) : null}

        {vorgang.detectedContext && vorgang.detectedContext.length > 0 ? (
          <ul className="mt-4 space-y-1 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
            {vorgang.detectedContext.map((line) => (
              <li key={line} className="text-[12px] text-[#64748B]">
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
              <p className="text-[12px] text-[#334155]">{vorgang.helpyEmpfehlung}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
