"use client";

import { useMemo } from "react";
import { isConnectedMailVorgang } from "@/features/decision/services/decision-engine";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { GmailOriginalMessageCard } from "@/features/workspace/components/gmail-vorgang/gmail-original-message-card";
import { GmailPreparedSection } from "@/features/workspace/components/gmail-vorgang/gmail-prepared-section";
import {
  PlatformBesichtigungWorkspaceCard,
  PlatformObjektWorkspaceCard,
} from "@/features/workspace/components/gmail-vorgang/platform-inquiry-workspace-card";
import { HelpyRecognizedDocumentsCard } from "@/features/documents/components/helpy-recognized-documents-card";
import { WorkspaceVorgangHideButton } from "@/features/workspace/components/workspace-vorgang-hide-button";
import { HelpyEmpfiehltWorkspaceCompact } from "@/features/decision/components/helpy-empfiehlt-workspace-compact";
import { HelpyWorkspaceSummary } from "@/features/workspace/components/helpy-workspace-summary";
import { FollowupNextCard } from "@/features/followup/components/followup-next-card";
import { GmailWorkflowStepsCard } from "@/features/workspace/components/gmail-vorgang/gmail-workflow-steps-card";
import { CustomerSection } from "@/features/workspace/components/workspace-sections";
import { customerToVorgangKunde, useWorkspaceContext } from "@/features/workspace/context";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type GmailVorgangWorkspaceBodyProps = {
  vorgang: Vorgang;
};

export function GmailVorgangWorkspaceBody({ vorgang }: GmailVorgangWorkspaceBodyProps) {
  const context = useWorkspaceContext();
  const skillConfig = getSkillConfig(vorgang.skill);

  const liveVorgang = useMemo(() => {
    if (!context.customer) return vorgang;
    return {
      ...vorgang,
      kunde: customerToVorgangKunde(context.customer),
    };
  }, [context.customer, vorgang]);

  if (!isConnectedMailVorgang(vorgang)) {
    return null;
  }

  const quelle = context.mail.quelle;
  const isPlatformInquiry = isPlatformRealEstateQuelle(quelle);

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6 lg:p-8">
      <header className="mb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
              {vorgang.aufgabe.titel}
            </h1>
            <p className="mt-1 text-[13px] text-[#64748B]">
              {skillConfig.label} · {isPlatformInquiry ? `Aus ${quelle} vorbereitet` : "Aus Original-E-Mail vorbereitet"}
            </p>
          </div>
          <WorkspaceVorgangHideButton vorgangId={vorgang.id} />
        </div>
      </header>

      <HelpyWorkspaceSummary />
      <GmailOriginalMessageCard />
      <CustomerSection
        vorgang={liveVorgang}
        title={isPlatformInquiry ? "Interessent" : "Kundeninformationen"}
        id="workspace-interessent"
      />
      {isPlatformInquiry && (
        <>
          <div id="workspace-objekt">
            <PlatformObjektWorkspaceCard />
          </div>
          <div id="workspace-besichtigung">
            <PlatformBesichtigungWorkspaceCard />
          </div>
        </>
      )}
      <div id="workspace-vorbereitet">
        <GmailPreparedSection />
      </div>
      <HelpyRecognizedDocumentsCard />
      <HelpyEmpfiehltWorkspaceCompact />
      <FollowupNextCard vorgangId={vorgang.id} />
      <GmailWorkflowStepsCard />
    </div>
  );
}
