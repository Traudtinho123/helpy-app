"use client";

import { useEffect, useMemo } from "react";
import { HelpyAppointmentSuggestionCard } from "@/features/appointment-suggestions/components/helpy-appointment-suggestion-card";
import {
  isAppointmentVorgang,
  loadAppointmentSuggestionForWorkspace,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  isGmailVorgang,
  isOutlookVorgang,
  isVoiceVorgang,
} from "@/features/decision/services/decision-engine";
import { useOptionalWorkspaceContext } from "@/features/workspace/context";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

type HelpyAppointmentSuggestionWorkspaceCardProps = {
  vorgang?: WorkspaceVorgang;
  listeVorgang?: ListeVorgang;
  className?: string;
  onRegisterOpenReview?: (open: () => void) => void;
  onConfirmed?: (message: string) => void;
};

function supportsAppointmentSuggestions(vorgang: WorkspaceVorgang): boolean {
  return (
    isGmailVorgang(vorgang) ||
    isOutlookVorgang(vorgang) ||
    isVoiceVorgang(vorgang)
  );
}

function toListeVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang | null
): ListeVorgang | null {
  if (liste) return liste;

  return {
    id: vorgang.id,
    typ: "normale_nachricht",
    titel: vorgang.aufgabe.titel,
    emoji: "✉",
    kunde: vorgang.kunde.firmenname,
    quelle: vorgang.kopfzeile?.quelle ?? "Gmail",
    prioritaet: "mittel",
    status: "neu",
    helpyEmpfehlung: vorgang.helpy.empfehlung,
    receivedAt: new Date().toISOString(),
    receivedLabel: vorgang.letzteEmail.datum,
    from: vorgang.letzteEmail.absender,
    snippet: vorgang.letzteEmail.inhalt,
    skill: vorgang.skill,
    intentLabel: vorgang.kopfzeile?.intentLabel,
  };
}

export function HelpyAppointmentSuggestionWorkspaceCard({
  vorgang: vorgangProp,
  listeVorgang: listeVorgangProp,
  className,
  onRegisterOpenReview,
  onConfirmed,
}: HelpyAppointmentSuggestionWorkspaceCardProps) {
  const workspaceContext = useOptionalWorkspaceContext();
  const vorgang = workspaceContext?.vorgang ?? vorgangProp;
  const listeVorgang = workspaceContext?.listeVorgang ?? listeVorgangProp;

  const liste = useMemo(
    () => (vorgang ? toListeVorgang(vorgang, listeVorgang) : null),
    [listeVorgang, vorgang]
  );

  useEffect(() => {
    if (workspaceContext || !vorgang || !liste) return;
    if (!supportsAppointmentSuggestions(vorgang)) return;
    if (!isAppointmentVorgang(vorgang, liste)) return;
    void loadAppointmentSuggestionForWorkspace(vorgang, liste);
  }, [liste, vorgang, workspaceContext]);

  if (!vorgang || !liste) return null;
  if (!supportsAppointmentSuggestions(vorgang)) return null;
  if (!isAppointmentVorgang(vorgang, liste)) return null;

  return (
    <HelpyAppointmentSuggestionCard
      vorgang={liste}
      className={className}
      onRegisterOpenReview={onRegisterOpenReview}
      onConfirmed={onConfirmed}
    />
  );
}
