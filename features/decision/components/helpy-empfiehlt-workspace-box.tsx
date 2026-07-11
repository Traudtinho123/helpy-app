"use client";

import { useMemo } from "react";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { HelpyEmpfiehltBoxFromDecision } from "@/features/decision/components/helpy-empfiehlt-box";
import {
  getHelpyDecision,
  isGmailVorgang,
  subscribeHelpyDecision,
} from "@/features/decision/services/decision-engine";
import { shouldPrepareArchiveForWorkspace } from "@/features/spam-handling/services/archive-handling-engine";
import { getMailListeVorgang } from "@/features/mail";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type HelpyEmpfiehltWorkspaceBoxProps = {
  vorgang: Vorgang;
  className?: string;
};

export function HelpyEmpfiehltWorkspaceBox({
  vorgang,
  className,
}: HelpyEmpfiehltWorkspaceBoxProps) {
  const listeVorgang = useMemo(
    () => getMailListeVorgang(vorgang.id),
    [vorgang.id]
  );

  const revision = useStoreRevision(subscribeHelpyDecision);
  const decision = useMemo(() => {
    if (!isGmailVorgang(vorgang)) return null;
    return getHelpyDecision(vorgang.id);
  }, [vorgang, revision]);

  if (!decision || shouldPrepareArchiveForWorkspace(vorgang, listeVorgang ?? undefined)) {
    return null;
  }

  return (
    <HelpyEmpfiehltBoxFromDecision
      decision={decision}
      vorgangId={vorgang.id}
      className={className}
      showAction={false}
    />
  );
}
