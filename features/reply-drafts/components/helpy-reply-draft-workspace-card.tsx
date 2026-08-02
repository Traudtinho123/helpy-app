"use client";

import { useMemo } from "react";
import { Mail } from "lucide-react";
import { HelpyReplyDraftCard } from "@/features/reply-drafts/components/helpy-reply-draft-card";
import { isConnectedMailVorgang } from "@/features/decision/services/decision-engine";
import { isNonReplyableVorgang } from "@/features/mail/services/non-replyable-vorgang";
import { useWorkspaceContext } from "@/features/workspace/context";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

type HelpyReplyDraftWorkspaceCardProps = {
  className?: string;
  onRegisterOpenReview?: (open: () => void) => void;
};

const fallbackListeCache = new Map<string, { cacheKey: string; value: ListeVorgang }>();

function getFallbackListeVorgang(vorgang: WorkspaceVorgang): ListeVorgang {
  const cacheKey = [
    vorgang.aufgabe.titel,
    vorgang.letzteEmail.absender,
    vorgang.letzteEmail.datum,
    vorgang.kopfzeile?.quelle ?? "Gmail",
  ].join("|");

  const cached = fallbackListeCache.get(vorgang.id);
  if (cached?.cacheKey === cacheKey) {
    return cached.value;
  }

  const next: ListeVorgang = {
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

  fallbackListeCache.set(vorgang.id, { cacheKey, value: next });
  return next;
}

function resolveListeVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang | null
): ListeVorgang | null {
  if (liste) return liste;
  return getFallbackListeVorgang(vorgang);
}

export function HelpyReplyDraftWorkspaceCard({
  className,
  onRegisterOpenReview,
}: HelpyReplyDraftWorkspaceCardProps) {
  const { vorgang, listeVorgang } = useWorkspaceContext();

  const liste = useMemo(
    () => resolveListeVorgang(vorgang, listeVorgang),
    [listeVorgang, vorgang]
  );

  if (!isConnectedMailVorgang(vorgang) || !liste) return null;

  if (isNonReplyableVorgang(liste)) {
    return (
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-[var(--text-muted)]" />
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">Antwort</p>
        </div>
        <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
          System-Mail – keine Antwort möglich
        </p>
      </div>
    );
  }

  return (
    <HelpyReplyDraftCard
      vorgang={liste}
      className={className}
      onRegisterOpenReview={onRegisterOpenReview}
    />
  );
}
