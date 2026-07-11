"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, BadgeCheck, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpyReviewModal } from "@/features/review/components";
import {
  confirmArchivePreparation,
  createReviewForArchive,
  getOrPrepareArchive,
  subscribeArchivePreparation,
} from "@/features/spam-handling/services/archive-handling-engine";
import type { ArchivePreparation } from "@/features/spam-handling/types/archive-types";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import type { HelpyReview } from "@/features/review/services/types";
import {
  HELPY_BUTTON_ARCHIVIERUNG_PRUEFEN,
  HELPY_ARCHIVE_STATUS_PREPARED,
} from "@/features/review/services/safety";
import {
  recordReviewConfirmed,
  recordReviewOpened,
} from "@/features/workspace/services/status";
import {
  completeVorgang,
  VORGANG_ERLEDIGT_SUCCESS,
} from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type HelpyArchiveCardProps = {
  vorgang: Vorgang;
  className?: string;
  onRegisterOpenReview?: (open: () => void) => void;
  onCompleted?: (message: string, helpyPanelMessage: string) => void;
};

function useArchivePreparation(vorgang: Vorgang): ArchivePreparation | null {
  return useExternalStore(
    subscribeArchivePreparation,
    () => (shouldPrepareArchive(vorgang) ? getOrPrepareArchive(vorgang) : null),
    () => (shouldPrepareArchive(vorgang) ? getOrPrepareArchive(vorgang) : null)
  );
}

export function HelpyArchiveCard({
  vorgang,
  className,
  onRegisterOpenReview,
  onCompleted,
}: HelpyArchiveCardProps) {
  const preparation = useArchivePreparation(vorgang);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<HelpyReview | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleOpenReview = useCallback(() => {
    if (!preparation) return;
    recordReviewOpened(vorgang.id);
    setActiveReview(createReviewForArchive(preparation));
    setReviewOpen(true);
  }, [preparation, vorgang.id]);

  useEffect(() => {
    if (!onRegisterOpenReview || !preparation) return;
    onRegisterOpenReview(handleOpenReview);
  }, [handleOpenReview, onRegisterOpenReview, preparation]);

  const handleConfirmReview = useCallback(async () => {
    setConfirmLoading(true);

    confirmArchivePreparation(vorgang.id);
    recordReviewConfirmed(vorgang.id);

    const supabase = createClient();
    const session = supabase
      ? (await supabase.auth.getSession()).data.session
      : null;
    const result = await completeVorgang(vorgang, session?.provider_token);

    setConfirmLoading(false);

    if (!result.ok) {
      setFeedback(result.message);
      return;
    }

    setReviewOpen(false);
    setActiveReview(null);
    setFeedback(result.message || VORGANG_ERLEDIGT_SUCCESS);
    onCompleted?.(result.message, result.helpyPanelMessage);
  }, [onCompleted, vorgang]);

  if (!preparation) return null;

  const isConfirmed = preparation.status === "archivierung_bestaetigt";

  return (
    <>
      <HelpyReviewModal
        review={activeReview}
        open={reviewOpen}
        vorgangId={vorgang.id}
        showHistory={false}
        confirmLoading={confirmLoading}
        onConfirm={() => {
          void handleConfirmReview();
        }}
        onCancel={() => {
          if (!confirmLoading) {
            setReviewOpen(false);
            setActiveReview(null);
          }
        }}
      />

      <div
        className={cn(
          "rounded-[18px] border border-[#E2E8F0]/70 bg-gradient-to-br from-[#F8FAFC]/95 to-white/90 p-4 shadow-sm backdrop-blur-sm",
          className
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-[#64748B]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[#0F172A]">
              {HELPY_ARCHIVE_STATUS_PREPARED}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
              isConfirmed
                ? "border-[#CBD5E1]/60 bg-[#F8FAFC] text-[#64748B]"
                : "border-[#FDE68A]/60 bg-[#FFFBEB]/70 text-[#B45309]"
            )}
          >
            {isConfirmed && <BadgeCheck className="size-3" strokeWidth={2.5} />}
            {preparation.statusLabel}
          </span>
        </div>

        <div className="rounded-[14px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/40 px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#2563EB]" strokeWidth={2} />
            <div>
              <p className="text-[10px] font-semibold tracking-[0.04em] text-[#2563EB] uppercase">
                HELPY empfiehlt
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#334155]">
                {preparation.recommendation}
              </p>
            </div>
          </div>
        </div>

        {feedback && (
          <p className="mt-3 rounded-[10px] border border-[#CBD5E1]/50 bg-[#F8FAFC]/80 px-3 py-2 text-[11px] leading-relaxed text-[#64748B]">
            {feedback}
          </p>
        )}

        {!isConfirmed && (
          <Button
            type="button"
            onClick={handleOpenReview}
            className="mt-4 h-9 rounded-[12px] bg-gradient-to-r from-[#64748B] to-[#475569] px-4 text-[12px] font-semibold text-white shadow-sm hover:shadow-md"
          >
            {HELPY_BUTTON_ARCHIVIERUNG_PRUEFEN}
          </Button>
        )}
      </div>
    </>
  );
}
