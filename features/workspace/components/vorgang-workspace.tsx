"use client";

import { isConnectedMailVorgang, isVoiceVorgang } from "@/features/decision/services/decision-engine";
import { VoicePhoneAppointmentCard } from "@/features/voice/components/voice-phone-appointment-card";
import { GmailVorgangWorkspaceBody } from "@/features/workspace/components/gmail-vorgang/gmail-vorgang-workspace-body";
import { HelpyWorkspaceSummary } from "@/features/workspace/components/helpy-workspace-summary";
import { WorkspaceMiddleColumn } from "@/features/workspace/components/workspace-middle-column";
import { WorkspaceWorkflowCard } from "@/features/workspace/components/workspace-workflow-card";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";

type VorgangWorkspaceProps = {
  vorgang: Vorgang;
};

export function VorgangWorkspace({ vorgang }: VorgangWorkspaceProps) {
  const isMail = isConnectedMailVorgang(vorgang);
  const isVoice = isVoiceVorgang(vorgang);

  if (isMail) {
    return <GmailVorgangWorkspaceBody vorgang={vorgang} />;
  }

  const skillConfig = getSkillConfig(vorgang.skill);

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6 lg:p-8">
      <header className="mb-2">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
          {vorgang.aufgabe.titel}
        </h1>
        <p className="mt-1 text-[13px] text-[#64748B]">
          {skillConfig.label} · Vorgangsorientierte Ansicht
        </p>
      </header>

      <HelpyWorkspaceSummary />

      {isVoice && <VoicePhoneAppointmentCard vorgangId={vorgang.id} />}

      <WorkspaceWorkflowCard vorgang={vorgang} />
      <WorkspaceMiddleColumn vorgang={vorgang} />
    </div>
  );
}
