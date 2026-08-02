"use client";

import { isConnectedMailVorgang } from "@/features/decision/services/decision-engine";
import { VorgangSimplifiedWorkspace } from "@/features/workspace/components/gmail-vorgang/vorgang-simplified-workspace";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type GmailVorgangWorkspaceBodyProps = {
  vorgang: Vorgang;
};

export function GmailVorgangWorkspaceBody({ vorgang }: GmailVorgangWorkspaceBodyProps) {
  if (!isConnectedMailVorgang(vorgang)) {
    return null;
  }

  return <VorgangSimplifiedWorkspace vorgangId={vorgang.id} />;
}
