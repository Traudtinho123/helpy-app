"use client";

import { useMemo } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
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
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
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
        </>
      }
    >
      <div className="flex gap-3.5 px-1">
          <HelpyAvatar size="sm" pose="typing" />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[11px] font-semibold text-[#64748B]">
              HELPY · Workspace
            </p>

            <div className="rounded-[20px] rounded-tl-[8px] border border-[#CBD5E1]/50 bg-[#F8FAFC] px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <p className="text-[13px] leading-[1.65] text-[#334155]">{intro}</p>
              <HelpyPanelResponseTimerHint listeVorgang={listeVorgang} />
            </div>

            {!isConnectedMail && (
              <WorkspaceDecisionPanel
                vorgang={vorgang}
                onOpenWorkflow={openWorkflow}
              />
            )}

            <div className="mt-4 rounded-[16px] border border-[#E2E8F0]/70 bg-white/90 px-4 py-3.5">
              <p className="text-[11px] font-semibold text-[#64748B]">
                Ich habe erkannt…
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
                {erkannt}
              </p>
            </div>

            <div className="mt-3 rounded-[16px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 px-4 py-3.5">
              <p className="text-[11px] font-semibold text-[#2563EB]">
                Ich empfehle…
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
                {empfehlung}
              </p>
              {isConnectedMail && mailDecision && !isArchiveCandidate && (
                <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">
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
              <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
                {naechsterSchritt}
              </p>
            </div>

            {isConnectedMail && mailDecision && !isArchiveCandidate && (
              <div className="mt-3 rounded-[16px] border border-[#E2E8F0]/70 bg-white/90 px-4 py-3.5">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Von HELPY vorbereitet
                </p>
                <ul className="mt-2 space-y-1">
                  {mailDecision.preparedItems.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-[11px] leading-relaxed text-[#64748B]"
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
                <p className="mb-3 text-[12px] font-semibold text-[#475569]">
                  HELPY Aktionen
                </p>
                <ActionCards
                  key={`${vorgang.id}-${activeSkill}`}
                  vorgang={vorgang}
                  skill={activeSkill}
                />
              </div>
            )}

            <HelpyErinnertSichCard hints={memoryHints} />
          </div>
        </div>
    </HelpyPanelShell>
  );
}
