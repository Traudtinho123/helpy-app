"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResolvedHelpyAction } from "@/features/brain/services/helpy-actions/resolve-action-execution";
import {
  buildGoogleMapsUrl,
  buildTelUrl,
} from "@/features/brain/services/helpy-actions/action-context";
import { toListeVorgangFromWorkspace } from "@/features/brain/services/helpy-actions/workspace-vorgang-adapter";
import type { HelpyActionExecutionState } from "@/features/brain/services/helpy-actions/types";
import {
  openDocumentCreationForVorgang,
} from "@/features/documents/services/open-document-creation";
import {
  openDokumentPanel,
  openKundePanel,
  openObjektPanel,
  openTerminPanel,
  openWorkspacePanelWithFallback,
} from "@/features/workspace/panels/workspace-panel-openers";
import { getDokumentePath } from "@/features/workspace/services/navigation/entity-navigation";
import { completeVorgang } from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import { getGmailListeVorgang } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import { createClient } from "@/lib/supabase/client";

export type HelpyActionInlinePanel = "none" | "reply" | "appointment";

type UseHelpyActionExecutorOptions = {
  vorgang: Vorgang;
  onOpenWorkflow?: () => void;
  onOpenReplyReview?: () => void;
  onOpenAppointmentReview?: () => void;
  onActionCompleted?: (actionId: string, message?: string) => void;
};

export function useHelpyActionExecutor({
  vorgang,
  onOpenWorkflow,
  onOpenReplyReview,
  onOpenAppointmentReview,
  onActionCompleted,
}: UseHelpyActionExecutorOptions) {
  const router = useRouter();
  const [states, setStates] = useState<Record<string, HelpyActionExecutionState>>({});
  const [inlinePanel, setInlinePanel] = useState<HelpyActionInlinePanel>("none");
  const [feedback, setFeedback] = useState<string | null>(null);

  const getStatus = useCallback(
    (actionId: string): HelpyActionExecutionState => states[actionId] ?? "idle",
    [states]
  );

  const executeAction = useCallback(
    async (action: ResolvedHelpyAction) => {
      if (action.disabled || states[action.id] === "preparing") return;

      setStates((current) => ({ ...current, [action.id]: "preparing" }));
      setFeedback(null);

      try {
        switch (action.executionKind) {
          case "route": {
            if (!action.routeAddress) break;
            window.open(buildGoogleMapsUrl(action.routeAddress), "_blank", "noopener,noreferrer");
            break;
          }

          case "call": {
            if (!action.phoneNumber) break;
            window.open(buildTelUrl(action.phoneNumber), "_self");
            break;
          }

          case "reply": {
            if (onOpenReplyReview) {
              onOpenReplyReview();
            } else {
              setInlinePanel("reply");
              onOpenWorkflow?.();
            }
            break;
          }

          case "appointment": {
            const panelResult = openTerminPanel({ vorgangId: vorgang.id });
            if (panelResult.opened) break;

            if (onOpenAppointmentReview) {
              onOpenAppointmentReview();
            } else if (panelResult.fallbackHref) {
              router.push(panelResult.fallbackHref);
            } else {
              setInlinePanel("appointment");
            }
            break;
          }

          case "document": {
            const focus = action.documentFocus ?? "dokument";
            const kind =
              focus === "expose"
                ? "expose"
                : focus === "offerte"
                  ? "offerte"
                  : focus === "angebot"
                    ? "angebot"
                    : null;

            if (kind && openDocumentCreationForVorgang({ vorgangId: vorgang.id, kind })) {
              break;
            }

            const panelResult = openDokumentPanel({
              vorgangId: vorgang.id,
              focus,
            });
            openWorkspacePanelWithFallback(panelResult, router.push);
            if (!panelResult.opened) {
              router.push(
                getDokumentePath({
                  vorgangId: vorgang.id,
                  focus,
                })
              );
            }
            break;
          }

          case "navigate-kunde": {
            const panelResult = openKundePanel({ vorgangId: vorgang.id });
            openWorkspacePanelWithFallback(panelResult, router.push);
            break;
          }

          case "navigate-objekte": {
            const panelResult = openObjektPanel({ vorgangId: vorgang.id });
            openWorkspacePanelWithFallback(panelResult, router.push);
            break;
          }

          case "complete": {
            const listeVorgang = getGmailListeVorgang(vorgang.id) ?? toListeVorgangFromWorkspace(vorgang);
            const supabase = createClient();
            const session = supabase
              ? (await supabase.auth.getSession()).data.session
              : null;
            const result = await completeVorgang(listeVorgang, session?.provider_token);
            if (!result.ok) {
              throw new Error(result.message);
            }
            setFeedback(result.helpyPanelMessage);
            onActionCompleted?.(action.id, result.message);
            break;
          }

          default:
            break;
        }

        setStates((current) => ({ ...current, [action.id]: "done" }));
        onActionCompleted?.(action.id);
      } catch (error) {
        setStates((current) => ({ ...current, [action.id]: "idle" }));
        setFeedback(
          error instanceof Error
            ? error.message
            : "Aktion konnte nicht ausgeführt werden."
        );
      }
    },
    [
      onActionCompleted,
      onOpenAppointmentReview,
      onOpenReplyReview,
      onOpenWorkflow,
      router,
      states,
      vorgang,
    ]
  );

  return {
    executeAction,
    getStatus,
    inlinePanel,
    setInlinePanel,
    feedback,
    listeVorgang: toListeVorgangFromWorkspace(vorgang),
  };
}
