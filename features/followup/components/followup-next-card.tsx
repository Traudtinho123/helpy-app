"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatFollowUpContactDate,
  getFollowUpActionFeedback,
  getFollowUpStatusLabel,
  markFollowUpAbgeschlossen,
} from "@/features/followup/services/followup-engine";
import { useFollowUp } from "@/features/followup/hooks/use-followup";
import { useGmailWorkspaceActions } from "@/features/workspace/components/gmail-vorgang/gmail-workspace-actions-context";
import { FieldGrid, SectionCard } from "@/features/workspace/components/workspace-sections";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FollowUpPreparedActionKind } from "@/features/followup/types/followup-types";
import { refreshFollowUp } from "@/features/followup/services/followup-engine";

type FollowupNextCardProps = {
  vorgangId: string;
};

export function FollowupNextCard({ vorgangId }: FollowupNextCardProps) {
  const followUp = useFollowUp(vorgangId);
  const actions = useGmailWorkspaceActions();
  const [feedback, setFeedback] = useState<string | null>(null);
  const initializedVorgangRef = useRef<string | null>(null);

  useEffect(() => {
    if (initializedVorgangRef.current === vorgangId) return;
    initializedVorgangRef.current = vorgangId;
    refreshFollowUp(vorgangId);
  }, [vorgangId]);

  const handleAction = useCallback(
    (kind: FollowUpPreparedActionKind) => {
      if (kind === "nachfrage_pruefen") {
        actions?.triggerReplyReview();
        setFeedback(getFollowUpActionFeedback(kind));
        return;
      }

      if (kind === "anruf_planen") {
        setFeedback(getFollowUpActionFeedback(kind));
        return;
      }

      markFollowUpAbgeschlossen(vorgangId);
      setFeedback(getFollowUpActionFeedback(kind));
    },
    [actions, vorgangId]
  );

  if (!followUp || followUp.status === "abgeschlossen") {
    return null;
  }

  return (
    <SectionCard title="Nächster Follow-up" icon={Clock}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="h-5 rounded-full border-[#BFDBFE]/60 bg-[#EFF6FF]/80 px-2 text-[10px] font-semibold text-[#2563EB]"
          >
            {getFollowUpStatusLabel(followUp.status)}
          </Badge>
          <span className="text-[12px] text-[#64748B]">{followUp.customerName}</span>
        </div>

        <FieldGrid
          fields={[
            {
              label: "Letzter Kontakt",
              value: formatFollowUpContactDate(followUp.lastOutgoingMail),
            },
            {
              label: "Tage ohne Antwort",
              value:
                followUp.daysWithoutAnswer === 0
                  ? "Heute versendet"
                  : `${followUp.daysWithoutAnswer} Tage`,
              highlight: followUp.daysWithoutAnswer >= 3,
            },
          ]}
        />

        <div className="rounded-[12px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/40 px-3.5 py-3">
          <p className="text-[11px] font-semibold text-[#2563EB]">Nächster Schritt</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#334155]">
            {followUp.recommendation}
          </p>
        </div>

        {followUp.preparedAction && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[#64748B]">Empfohlene Aktion</p>
            <p className="text-[12px] text-[#334155]">{followUp.preparedAction.label}</p>
            <Button
              type="button"
              onClick={() => handleAction(followUp.preparedAction!.kind)}
              className="h-9 w-full justify-center rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm"
            >
              {followUp.preparedAction.buttonLabel}
            </Button>
          </div>
        )}

        {feedback && (
          <p className="rounded-[12px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#047857]">
            {feedback}
          </p>
        )}

        <Link
          href={followUp.href}
          className="inline-flex text-[11px] font-medium text-[#2563EB] hover:underline"
        >
          Vorgang öffnen
        </Link>
      </div>
    </SectionCard>
  );
}
