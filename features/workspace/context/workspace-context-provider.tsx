"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { loadAppointmentSuggestionForWorkspace } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { isAppointmentVorgang } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  getOrEvaluateHelpyDecisionForWorkspace,
  isConnectedMailVorgang,
  isVoiceVorgang,
} from "@/features/decision/services/decision-engine";
import { prepareKundenakteFromWorkspace } from "@/features/kundenakte/services/kundenakte-engine";
import {
  getOrEvaluateReplyDraftForWorkspace,
} from "@/features/reply-drafts/services/reply-draft-engine";
import {
  getOrPrepareArchiveForWorkspace,
  shouldPrepareArchiveForWorkspace,
} from "@/features/spam-handling/services/archive-handling-engine";
import { syncCrmFromWorkspaceVorgang } from "@/features/crm/services/crm-sync";
import type { WorkspaceContext } from "@/features/workspace/context/workspace-context";
import {
  getStableWorkspaceContext,
  subscribeWorkspaceContext,
} from "@/features/workspace/context/workspace-context-service";
import {
  getMailListeVorgang,
  subscribeAllMailVorgaenge,
} from "@/features/mail/unified-mail-source-service";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { markHelpyReportRead } from "@/features/workspace/services/vorgaenge/helpy-report-read-store";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";

const MISSING_LISTE_VORGANG = null as ListeVorgang | null;

type WorkspaceContextProviderProps = {
  vorgang: Vorgang;
  children: ReactNode;
};

const WorkspaceContextReact = createContext<WorkspaceContext | null>(null);

export function WorkspaceContextProvider({
  vorgang,
  children,
}: WorkspaceContextProviderProps) {
  const mailRevision = useStoreRevision(subscribeAllMailVorgaenge);
  const storeRevision = useStoreRevision(subscribeWorkspaceContext);
  const initializedRef = useRef<string | null>(null);

  const listeVorgang = useMemo(
    () => getMailListeVorgang(vorgang.id) ?? MISSING_LISTE_VORGANG,
    [vorgang.id, mailRevision]
  );

  const context = useMemo(
    () => getStableWorkspaceContext(vorgang, listeVorgang ?? undefined),
    [vorgang, listeVorgang, storeRevision]
  );

  useEffect(() => {
    const seedKey = `${vorgang.id}:${listeVorgang?.id ?? "none"}`;
    if (initializedRef.current === seedKey) return;
    initializedRef.current = seedKey;

    if (listeVorgang && isHelpyReportVorgang(listeVorgang)) {
      markHelpyReportRead(listeVorgang.id);
      return;
    }

    syncCrmFromWorkspaceVorgang(vorgang, listeVorgang ?? undefined);

    const source = {
      quelle: listeVorgang?.quelle,
      id: vorgang.id,
      kopfzeile: vorgang.kopfzeile,
      mailProvider: listeVorgang?.mailProvider,
    };
    const isMail = isConnectedMailVorgang(source);
    const isVoice = isVoiceVorgang(source);

    if (isMail) {
      getOrEvaluateHelpyDecisionForWorkspace(vorgang, listeVorgang ?? undefined);

      if (shouldPrepareArchiveForWorkspace(vorgang, listeVorgang ?? undefined)) {
        getOrPrepareArchiveForWorkspace(vorgang, listeVorgang ?? undefined);
        return;
      }

      prepareKundenakteFromWorkspace(vorgang, listeVorgang ?? undefined);
      getOrEvaluateReplyDraftForWorkspace(vorgang, listeVorgang ?? undefined);
    }

    if ((isMail || isVoice) && isAppointmentVorgang(vorgang, listeVorgang ?? undefined)) {
      void loadAppointmentSuggestionForWorkspace(vorgang, listeVorgang ?? undefined);
    }
  }, [listeVorgang, vorgang]);

  return (
    <WorkspaceContextReact.Provider value={context}>
      {children}
    </WorkspaceContextReact.Provider>
  );
}

export function useWorkspaceContext(): WorkspaceContext {
  const context = useContext(WorkspaceContextReact);

  if (!context || !context.workspaceId) {
    throw new Error("useWorkspaceContext must be used within WorkspaceContextProvider");
  }

  return context;
}

export function useOptionalWorkspaceContext(): WorkspaceContext | null {
  const context = useContext(WorkspaceContextReact);
  if (!context?.workspaceId) return null;
  return context;
}
