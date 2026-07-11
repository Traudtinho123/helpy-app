"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpyReviewModal } from "@/features/review/components";
import {
  confirmPreparedAction,
  getPreparedActionsForVorgang,
  PREPARED_ACTIONS_SECTION_TITLE,
  type PreparedHelpyAction,
} from "@/features/review/services/actions";
import { createReviewForAction, type HelpyReview } from "@/features/review/services";
import {
  HELPY_BUTTON_PRUEFEN,
  HELPY_PANEL_REVIEW_INTRO,
} from "@/features/review/services/safety";
import {
  recordReviewConfirmed,
  recordReviewOpened,
} from "@/features/workspace/services/status";
import { resolveActionRoute } from "@/features/workspace/services/vorgaenge/vorgang-action-routes";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { cn } from "@/lib/utils";

type HelpyActionCardProps = {
  action: PreparedHelpyAction;
  onExecute: (action: PreparedHelpyAction) => void;
  feedbackMessage?: string;
};

const HelpyActionCard = memo(function HelpyActionCard({
  action,
  onExecute,
  feedbackMessage,
}: HelpyActionCardProps) {
  const isConfirmed = action.status === "bestaetigt";

  return (
    <div
      className={cn(
        "rounded-[16px] border bg-white/90 p-4 transition-all duration-300",
        isConfirmed
          ? "border-[#A7F3D0]/60 bg-[#ECFDF5]/40"
          : "border-[#CBD5E1]/45 hover:border-[#BFDBFE]/60 hover:shadow-[0_4px_16px_rgba(37,99,235,0.06)]"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[#F8FAFC] text-[16px]">
          {action.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[#0F172A]">{action.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
            {action.description}
          </p>
        </div>
      </div>

      {isConfirmed && feedbackMessage && (
        <p className="mt-3 rounded-[10px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 px-3 py-2 text-[11px] leading-relaxed text-[#047857]">
          {feedbackMessage}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {isConfirmed ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#047857]">
            <BadgeCheck className="size-3.5" strokeWidth={2.5} />
            Bestätigt
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => onExecute(action)}
            className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
          >
            {HELPY_BUTTON_PRUEFEN}
          </Button>
        )}
      </div>
    </div>
  );
});

type HelpyPreparedActionsInnerProps = {
  vorgang: Vorgang;
};

function HelpyPreparedActionsInner({ vorgang }: HelpyPreparedActionsInnerProps) {
  const router = useRouter();
  const [actions, setActions] = useState(() => getPreparedActionsForVorgang(vorgang));
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [activeReview, setActiveReview] = useState<HelpyReview | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const handleOpenReview = useCallback(
    (action: PreparedHelpyAction) => {
      recordReviewOpened(vorgang.id);

      const route = resolveActionRoute(action.actionTypeId, vorgang);
      if (route) {
        router.push(route);
        return;
      }

      const review = createReviewForAction(vorgang, action);
      setActiveReview(review);
      setReviewOpen(true);
    },
    [router, vorgang]
  );

  const handleConfirm = useCallback(() => {
    if (!activeReview) return;

    const result = confirmPreparedAction(activeReview.instanceId);
    recordReviewConfirmed(vorgang.id);

    setActions((prev) =>
      prev.map((action) =>
        action.instanceId === activeReview.instanceId
          ? { ...action, status: "bestaetigt" as const }
          : action
      )
    );

    setFeedback((prev) => ({
      ...prev,
      [activeReview.instanceId]: result.helpyMessage,
    }));

    setReviewOpen(false);
    setActiveReview(null);
  }, [activeReview, vorgang.id]);

  const handleCancel = useCallback(() => {
    setReviewOpen(false);
    setActiveReview(null);
  }, []);

  if (actions.length === 0) return null;

  return (
    <>
      <HelpyReviewModal
        review={activeReview}
        open={reviewOpen}
        vorgangId={vorgang.id}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onEdit={handleCancel}
      />

      <div className="mt-4 rounded-[18px] border border-[#BFDBFE]/40 bg-gradient-to-br from-[#EFF6FF]/50 to-white/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
          <p className="text-[12px] font-semibold text-[#2563EB]">
            {PREPARED_ACTIONS_SECTION_TITLE}
          </p>
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-[#64748B]">
          {HELPY_PANEL_REVIEW_INTRO}
        </p>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {actions.map((action) => (
            <HelpyActionCard
              key={action.instanceId}
              action={action}
              onExecute={handleOpenReview}
              feedbackMessage={feedback[action.instanceId]}
            />
          ))}
        </div>
      </div>
    </>
  );
}

type HelpyPreparedActionsProps = {
  vorgang: Vorgang;
};

export function HelpyPreparedActions({ vorgang }: HelpyPreparedActionsProps) {
  return <HelpyPreparedActionsInner key={vorgang.id} vorgang={vorgang} />;
}
