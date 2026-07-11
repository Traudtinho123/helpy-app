"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, CheckCircle2, Mail } from "lucide-react";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelFooter, PanelHeader } from "@/components/ui/Panel";
import { HelpyErinnertSichCard } from "@/features/memory/components/HelpyErinnertSichCard";
import {
  getBackgroundMemoryWorkspaceHintsServerSnapshot,
  getBackgroundMemoryWorkspaceHintsSnapshot,
} from "@/features/memory/services/background-memory-workspace";
import { subscribeBackgroundMemory } from "@/features/memory/services/background-memory-engine";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { isConnectedMailVorgang } from "@/features/decision/services/decision-engine";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { PLATFORM_INQUIRY_PANEL_INTRO } from "@/features/brain/types/platform-inquiry-types";
import {
  HELPY_APPOINTMENT_SAVED_PANEL,
} from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { useGmailWorkspaceActions } from "@/features/workspace/components/gmail-vorgang/gmail-workspace-actions-context";
import { HelpyPanelResponseTimerHint } from "@/features/workspace/components/response-timer/helpy-panel-response-timer-hint";
import { useWorkspaceContext } from "@/features/workspace/context";
import {
  HELPY_BUTTON_ANTWORT_PRUEFEN,
  HELPY_BUTTON_TERMIN_PRUEFEN,
  HELPY_BUTTON_ARCHIVIERUNG_PRUEFEN,
  HELPY_BUTTON_VORGANG_BESTAETIGEN,
  HELPY_GMAIL_WORKSPACE_INTRO,
} from "@/features/review/services/safety";
import {
  getFollowUpActionFeedback,
  HELPY_FOLLOWUP_MONITORING_MESSAGE,
  markFollowUpAbgeschlossen,
  refreshFollowUp,
} from "@/features/followup/services/followup-engine";
import { useFollowUp } from "@/features/followup/hooks/use-followup";
import type { FollowUpPreparedActionKind } from "@/features/followup/types/followup-types";
import {
  recordReviewConfirmed,
  recordReviewOpened,
} from "@/features/workspace/services/status";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type GmailWorkspaceHelpyPanelProps = {
  vorgang: Vorgang;
};

export function GmailWorkspaceHelpyPanel({ vorgang }: GmailWorkspaceHelpyPanelProps) {
  const actions = useGmailWorkspaceActions();
  const [feedback, setFeedback] = useState<string | null>(null);
  const followUp = useFollowUp(vorgang.id);
  const initializedFollowUpRef = useRef<string | null>(null);

  const {
    listeVorgang,
    mail,
    appointment,
    recommendation,
    currentWorkflow,
  } = useWorkspaceContext();

  useEffect(() => {
    if (initializedFollowUpRef.current === vorgang.id) return;
    initializedFollowUpRef.current = vorgang.id;
    refreshFollowUp(vorgang.id);
  }, [vorgang.id]);

  const isArchive = currentWorkflow.isArchive;
  const hasReplyDraft = Boolean(mail.replyDraft);
  const appointmentSuggestion = appointment.suggestion;

  const hasAppointmentSuggestions =
    appointmentSuggestion?.status === "vorbereitet" &&
    appointmentSuggestion.slots.length > 0;
  const appointmentConfirmed = appointmentSuggestion?.status === "bestaetigt";

  const memoryRevision = useStoreRevision(subscribeBackgroundMemory);

  const memoryHints = useMemo(() => {
    if (typeof window === "undefined") {
      return getBackgroundMemoryWorkspaceHintsServerSnapshot();
    }
    return getBackgroundMemoryWorkspaceHintsSnapshot({
      vorgang,
      liste: listeVorgang ?? undefined,
      hasAppointmentFlow: hasAppointmentSuggestions || appointmentConfirmed,
      hasReplyDraft,
    });
  }, [
    appointmentConfirmed,
    hasAppointmentSuggestions,
    hasReplyDraft,
    listeVorgang,
    memoryRevision,
    vorgang,
  ]);

  const handleReview = useCallback(() => {
    recordReviewOpened(vorgang.id);
    if (isArchive) {
      actions?.triggerArchiveReview();
      setFeedback("Archivierung zur Prüfung geöffnet.");
      return;
    }
    if (hasReplyDraft && !hasAppointmentSuggestions) {
      actions?.triggerReplyReview();
      setFeedback("Antwortentwurf zur Prüfung geöffnet.");
      return;
    }
    if (hasAppointmentSuggestions) {
      actions?.triggerAppointmentReview();
      setFeedback("Terminvorschlag zur Prüfung geöffnet.");
      return;
    }
    if (hasReplyDraft) {
      actions?.triggerReplyReview();
      setFeedback("Antwortentwurf zur Prüfung geöffnet.");
      return;
    }
    const target = document.getElementById("helpy-gmail-arbeitsablauf");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    setFeedback("Bitte prüfe die vorbereiteten Schritte.");
  }, [
    actions,
    hasAppointmentSuggestions,
    hasReplyDraft,
    isArchive,
    vorgang.id,
  ]);

  const handleConfirmVorgang = useCallback(() => {
    recordReviewConfirmed(vorgang.id);
    setFeedback(
      "Vorgang bestätigt. Nichts wurde ausgeführt — du behältst die Kontrolle."
    );
  }, [vorgang.id]);

  const handleFollowUpAction = useCallback(
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

      markFollowUpAbgeschlossen(vorgang.id);
      setFeedback(getFollowUpActionFeedback(kind));
    },
    [actions, vorgang.id]
  );

  const reviewButtonLabel = isArchive
    ? HELPY_BUTTON_ARCHIVIERUNG_PRUEFEN
    : hasReplyDraft && !hasAppointmentSuggestions
      ? HELPY_BUTTON_ANTWORT_PRUEFEN
      : hasAppointmentSuggestions
        ? HELPY_BUTTON_TERMIN_PRUEFEN
        : hasReplyDraft
          ? HELPY_BUTTON_ANTWORT_PRUEFEN
          : "Vorbereitung prüfen";

  const isPlatformInquiry = isPlatformRealEstateQuelle(mail.quelle);
  const panelIntro = isPlatformInquiry
    ? PLATFORM_INQUIRY_PANEL_INTRO
    : HELPY_GMAIL_WORKSPACE_INTRO;

  if (!isConnectedMailVorgang(vorgang)) {
    return null;
  }

  return (
    <Panel variant="workspace">
      <PanelHeader>
        <div className="flex items-center gap-3">
          <HelpyAvatar />
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
              HELPY
            </h2>
            <p className="text-[11px] font-medium text-[#64748B]">
              Vorgangs-Assistent
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="h-6 rounded-full border-[#A7F3D0] bg-[#ECFDF5] px-2.5 text-[10px] font-semibold text-[#047857]"
        >
          Bereit zur Prüfung
        </Badge>
      </PanelHeader>

      <PanelBody>
        <div className="flex gap-3.5">
          <HelpyAvatar size="sm" />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[11px] font-semibold text-[#64748B]">
              HELPY · Workspace
            </p>

            <div className="rounded-[20px] rounded-tl-[8px] border border-[#CBD5E1]/50 bg-[#F8FAFC] px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <p className="text-[13px] leading-[1.65] text-[#334155]">
                {followUp && followUp.status !== "abgeschlossen"
                  ? HELPY_FOLLOWUP_MONITORING_MESSAGE
                  : panelIntro}
              </p>
              <HelpyPanelResponseTimerHint listeVorgang={listeVorgang} />
            </div>

            {followUp &&
              followUp.status !== "abgeschlossen" &&
              followUp.preparedAction && (
                <div className="mt-4 rounded-[16px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 px-4 py-3.5">
                  <p className="text-[11px] font-semibold text-[#2563EB]">
                    Nächster Schritt
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
                    {followUp.recommendation}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-[#64748B]">
                    Empfohlene Aktion
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#334155]">
                    {followUp.preparedAction.label}
                  </p>
                  <Button
                    type="button"
                    onClick={() =>
                      handleFollowUpAction(followUp.preparedAction!.kind)
                    }
                    className="mt-3 h-9 w-full justify-center rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm"
                  >
                    {followUp.preparedAction.buttonLabel}
                  </Button>
                </div>
              )}

            {recommendation && !isArchive && (
              <div className="mt-4 rounded-[16px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 px-4 py-3.5">
                <p className="text-[11px] font-semibold text-[#2563EB]">
                  Kurzempfehlung
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
                  {recommendation.decisionTitle}
                </p>
              </div>
            )}

            <HelpyErinnertSichCard hints={memoryHints} />

            {(feedback || appointmentConfirmed) && (
              <p className="mt-4 rounded-[12px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#047857]">
                {feedback ?? HELPY_APPOINTMENT_SAVED_PANEL}
              </p>
            )}

            <div className="mt-5 space-y-2">
              <Button
                type="button"
                onClick={handleReview}
                className="h-10 w-full justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm"
              >
                <Mail className="size-3.5" strokeWidth={2} />
                {reviewButtonLabel}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmVorgang}
                variant="outline"
                className="h-10 w-full justify-center gap-2 rounded-[12px] border-[#CBD5E1]/60 bg-white/90 text-[12px] font-medium"
              >
                <CheckCircle2 className="size-3.5" strokeWidth={2} />
                {HELPY_BUTTON_VORGANG_BESTAETIGEN}
              </Button>
              <Link
                href="/vorgaenge"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-[#CBD5E1]/60 bg-white/90 text-[12px] font-medium text-[#334155] transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]/40"
              >
                <ArrowLeft className="size-3.5" />
                Zurück zu Vorgängen
              </Link>
            </div>
          </div>
        </div>
      </PanelBody>

      <PanelFooter>
        <p className="mb-3 text-[12px] font-semibold text-[#475569]">
          Frage HELPY zu diesem Vorgang
        </p>
        <div className="rounded-[20px] border border-[#CBD5E1]/50 bg-white p-2.5 shadow-sm">
          <textarea
            rows={2}
            placeholder="Frag HELPY…"
            className="w-full resize-none bg-transparent px-3 py-2 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
          />
          <div className="flex justify-end px-1 pb-1">
            <Button
              size="icon-sm"
              className="size-8 rounded-[12px] bg-[#2563EB] shadow-[0_4px_12px_rgba(37,99,235,0.35)]"
              aria-label="Senden"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </PanelFooter>
    </Panel>
  );
}
