"use client";

import { useMemo } from "react";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { HelpyArchiveCard } from "@/features/spam-handling/components/helpy-archive-card";
import {
  getOrPrepareArchiveForWorkspace,
  shouldPrepareArchiveForWorkspace,
  subscribeArchivePreparation,
} from "@/features/spam-handling/services/archive-handling-engine";
import { isConnectedMailVorgang } from "@/features/decision/services/decision-engine";
import { getMailListeVorgang } from "@/features/mail";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

type HelpyArchiveWorkspaceCardProps = {
  vorgang: WorkspaceVorgang;
  className?: string;
  onRegisterOpenReview?: (open: () => void) => void;
};

function toListeVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang | null
): ListeVorgang | null {
  if (liste) return liste;

  return {
    id: vorgang.id,
    typ: "normale_nachricht",
    titel: vorgang.aufgabe.titel,
    emoji: "📰",
    kunde: vorgang.kunde.firmenname,
    quelle: vorgang.kopfzeile?.quelle ?? "Gmail",
    prioritaet: "niedrig",
    status: "neu",
    helpyEmpfehlung: vorgang.helpy.empfehlung,
    receivedAt: new Date().toISOString(),
    receivedLabel: vorgang.letzteEmail.datum,
    from: vorgang.letzteEmail.absender,
    snippet: vorgang.letzteEmail.inhalt,
    intentLabel: vorgang.kopfzeile?.intentLabel,
    summary: vorgang.letzteEmail.zusammenfassung,
  };
}

export function HelpyArchiveWorkspaceCard({
  vorgang,
  className,
  onRegisterOpenReview,
}: HelpyArchiveWorkspaceCardProps) {
  const listeVorgang = useMemo(
    () => getMailListeVorgang(vorgang.id),
    [vorgang.id]
  );

  const liste = useMemo(
    () => toListeVorgang(vorgang, listeVorgang),
    [listeVorgang, vorgang]
  );

  const revision = useStoreRevision(subscribeArchivePreparation);
  useMemo(() => {
    if (
      !isConnectedMailVorgang(vorgang) ||
      !shouldPrepareArchiveForWorkspace(vorgang, listeVorgang ?? undefined)
    ) {
      return null;
    }
    return getOrPrepareArchiveForWorkspace(vorgang, listeVorgang ?? undefined);
  }, [vorgang, listeVorgang, revision]);

  if (
    !isConnectedMailVorgang(vorgang) ||
    !liste ||
    !shouldPrepareArchiveForWorkspace(vorgang, listeVorgang ?? undefined)
  ) {
    return null;
  }

  return (
    <HelpyArchiveCard
      vorgang={liste}
      className={className}
      onRegisterOpenReview={onRegisterOpenReview}
    />
  );
}
