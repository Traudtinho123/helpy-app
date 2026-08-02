"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { ActionCards } from "@/components/helpy/ActionCards";
import { HelpyErinnertSichCard } from "@/features/memory/components/HelpyErinnertSichCard";
import {
  getBackgroundMemoryWorkspaceHintsServerSnapshot,
  getBackgroundMemoryWorkspaceHintsSnapshot,
} from "@/features/memory/services/background-memory-workspace";
import { subscribeBackgroundMemory } from "@/features/memory/services/background-memory-engine";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { WorkspaceArbeitsablaufPanel } from "@/features/workspace/components/workspace-arbeitsablauf-panel";
import { WorkspaceDecisionPanel } from "@/features/workspace/components/workspace-decision-panel";
import { HelpyPanelResponseTimerHint } from "@/features/workspace/components/response-timer/helpy-panel-response-timer-hint";
import { useWorkspaceFlow } from "@/features/workspace/components/workspace-flow-context";
import { useGmailWorkspaceActions } from "@/features/workspace/components/gmail-vorgang/gmail-workspace-actions-context";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import { Badge } from "@/components/ui/badge";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import { HelpyChatComposer } from "@/features/helpy-chat/components/helpy-chat-composer";
import { HelpyChatThread } from "@/features/helpy-chat/components/helpy-chat-thread";
import { useHelpyChat } from "@/features/helpy-chat/hooks/use-helpy-chat";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import {
  getOrEvaluateHelpyDecisionForWorkspace,
  isConnectedMailVorgang,
} from "@/features/decision/services/decision-engine";
import { getMailListeVorgang } from "@/features/mail";
import { getOrEvaluateReplyDraftForWorkspace } from "@/features/reply-drafts/services/reply-draft-engine";
import {
  getOrPrepareArchiveForWorkspace,
  shouldPrepareArchiveForWorkspace,
} from "@/features/spam-handling/services/archive-handling-engine";
import {
  HELPY_ARCHIVE_PANEL_INTRO,
  HELPY_ARCHIVE_RECOMMENDATION,
  HELPY_GMAIL_DECISION_PANEL_INTRO,
  HELPY_REPLY_DRAFT_PANEL_INTRO,
  HELPY_WORKSPACE_INTRO,
} from "@/features/review/services/safety";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type WorkspaceHelpyPanelProps = {
  vorgang: Vorgang;
};

export function WorkspaceHelpyPanel({ vorgang }: WorkspaceHelpyPanelProps) {
  const { helpy, aufgabe } = vorgang;
  const { activeSkill } = useActiveSkill();
  const { openWorkflow } = useWorkspaceFlow();
  const gmailActions = useGmailWorkspaceActions();
  const isConnectedMail = isConnectedMailVorgang(vorgang);

  const listeVorgang = useMemo(
    () => getMailListeVorgang(vorgang.id),
    [vorgang.id]
  );

  const isArchiveCandidate =
    isConnectedMail && shouldPrepareArchiveForWorkspace(vorgang, listeVorgang ?? undefined);

  const mailDecision = useMemo(
    () =>
      isConnectedMail
        ? getOrEvaluateHelpyDecisionForWorkspace(vorgang, listeVorgang ?? undefined)
        : null,
    [isConnectedMail, vorgang, listeVorgang]
  );

  const mailReplyDraft = useMemo(
    () =>
      isConnectedMail
        ? getOrEvaluateReplyDraftForWorkspace(vorgang, listeVorgang ?? undefined)
        : null,
    [isConnectedMail, vorgang, listeVorgang]
  );

  const archivePreparation = useMemo(
    () =>
      isArchiveCandidate
        ? getOrPrepareArchiveForWorkspace(vorgang, listeVorgang ?? undefined)
        : null,
    [isArchiveCandidate, vorgang, listeVorgang]
  );

  const memoryRevision = useStoreRevision(subscribeBackgroundMemory);

  const memoryHints = useMemo(() => {
    if (typeof window === "undefined") {
      return getBackgroundMemoryWorkspaceHintsServerSnapshot();
    }
    return getBackgroundMemoryWorkspaceHintsSnapshot({
      vorgang,
      liste: listeVorgang ?? undefined,
      hasReplyDraft: Boolean(mailReplyDraft),
    });
  }, [mailReplyDraft, listeVorgang, memoryRevision, vorgang]);

  const intro = isArchiveCandidate
    ? HELPY_ARCHIVE_PANEL_INTRO
    : isConnectedMail
      ? mailReplyDraft
        ? HELPY_REPLY_DRAFT_PANEL_INTRO
        : mailDecision?.helpyMessage ?? HELPY_GMAIL_DECISION_PANEL_INTRO
      : helpy.intro ?? HELPY_WORKSPACE_INTRO;
  const empfehlung = isArchiveCandidate
    ? HELPY_ARCHIVE_RECOMMENDATION
    : isConnectedMail && mailDecision
      ? mailDecision.decisionTitle
      : helpy.empfehlung;
  const naechsterSchritt = isArchiveCandidate
    ? archivePreparation?.statusLabel ?? helpy.naechsterSchritt
    : isConnectedMail && mailDecision
      ? mailDecision.nextBestStep
      : helpy.naechsterSchritt;

  const erkannt =
    helpy.erkannt ?? helpy.begruessung ?? vorgang.letzteEmail.zusammenfassung;

  const vorgangSummary = [erkannt, empfehlung, naechsterSchritt]
    .filter(Boolean)
    .join(" · ");

  const { messages, isSending, error, sendMessage } = useHelpyChat({
    context: {
      surface: "workspace",
      vorgangId: vorgang.id,
      vorgangTitle: vorgang.aufgabe.titel,
      vorgangSummary,
      skill: activeSkill,
    },
  });

  return (
    <HelpyPanelShell
      variant="workspace"
      subtitle="Vorgangs-Assistent"
      deskCompact
      headerBadge={
        <Badge
          variant="outline"
          className="h-6 rounded-full border-[#A7F3D0] bg-[#ECFDF5] px-2.5 text-[10px] font-semibold text-[#047857]"
        >
          Bereit zur Prüfung
        </Badge>
      }
      footer={
        <>
          <p className="mb-3 text-[12px] font-semibold text-[var(--text-muted)]">
            Frage HELPY zu diesem Vorgang
          </p>
          <HelpyChatComposer
            onSend={sendMessage}
            isSending={isSending}
            placeholder="Frag HELPY…"
            variant="footer"
            showHint={false}
          />
        </>
      }
    >
      <div className="flex gap-3.5 px-1">
          <HelpyAvatar size="sm" pose="typing" />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[11px] font-semibold text-[var(--text-secondary)]">
              HELPY · Workspace
            </p>

            <div className="rounded-[20px] rounded-tl-[8px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <p className="text-[13px] leading-[1.65] text-[var(--text-secondary)]">{intro}</p>
              <HelpyPanelResponseTimerHint listeVorgang={listeVorgang} />
            </div>

            {!isConnectedMail && (
              <WorkspaceDecisionPanel
                vorgang={vorgang}
                onOpenWorkflow={openWorkflow}
              />
            )}

            <div className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3.5">
              <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Ich habe erkannt…
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {erkannt}
              </p>
            </div>

            <div className="mt-3 rounded-[16px] border border-[var(--border-accent)] bg-[var(--accent-light)]/50 px-4 py-3.5">
              <p className="text-[11px] font-semibold text-[var(--accent)]">
                Ich empfehle…
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {empfehlung}
              </p>
              {isConnectedMail && mailDecision && !isArchiveCandidate && (
                <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  {mailDecision.reason}
                </p>
              )}
            </div>

            <div className="mt-3 rounded-[16px] border border-[#FDE68A]/50 bg-[#FFFBEB]/50 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#D97706]" strokeWidth={2} />
                <p className="text-[11px] font-semibold text-[#B45309]">
                  Nächster Schritt…
                </p>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {naechsterSchritt}
              </p>
            </div>

            {isConnectedMail && mailDecision && !isArchiveCandidate && (
              <div className="mt-3 rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3.5">
                <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Von HELPY vorbereitet
                </p>
                <ul className="mt-2 space-y-1">
                  {mailDecision.preparedItems.map((item) => (
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
            )}

            {!isConnectedMail && <WorkspaceArbeitsablaufPanel vorgang={vorgang} />}

            {aufgabe.deadline && (
              <div className="mt-4 rounded-[14px] border border-[#FECACA]/60 bg-[#FEF2F2]/60 px-4 py-3">
                <p className="text-[11px] font-semibold text-[#DC2626]">
                  Frist: {aufgabe.deadline}
                </p>
              </div>
            )}

            {!isArchiveCandidate && (
              <div className="mt-5">
                <p className="mb-3 text-[12px] font-semibold text-[var(--text-muted)]">
                  HELPY Aktionen
                </p>
                <ActionCards
                  key={`${vorgang.id}-${activeSkill}`}
                  vorgang={vorgang}
                  skill={activeSkill}
                  onOpenWorkflow={openWorkflow}
                  onOpenReplyReview={gmailActions?.triggerReplyReview}
                  onOpenAppointmentReview={gmailActions?.triggerAppointmentReview}
                />
              </div>
            )}

            <HelpyErinnertSichCard hints={memoryHints} />

            <HelpyChatThread
              messages={messages}
              isSending={isSending}
              error={error}
              className="mt-5"
            />
          </div>
        </div>
    </HelpyPanelShell>
  );
}
