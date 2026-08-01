import {
  resolveActionKind,
  resolveDocumentFocus,
  type HelpyActionKind,
} from "@/features/brain/services/helpy-actions/action-kinds";
import {
  resolveVorgangPhone,
  resolveVorgangRouteAddress,
} from "@/features/brain/services/helpy-actions/action-context";
import type { HelpyAction } from "@/features/brain/services/helpy-actions/types";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

export type ResolvedHelpyAction = HelpyAction & {
  executionKind: HelpyActionKind;
  disabled: boolean;
  disabledReason?: string;
  routeAddress?: string;
  phoneNumber?: string;
  documentFocus?: "expose" | "offerte" | "angebot" | "dokument";
};

function resolveDisabledState(
  kind: HelpyActionKind,
  vorgang: Vorgang
): Pick<ResolvedHelpyAction, "disabled" | "disabledReason" | "routeAddress" | "phoneNumber"> {
  if (kind === "route") {
    const routeAddress = resolveVorgangRouteAddress(vorgang);
    if (!routeAddress) {
      return {
        disabled: true,
        disabledReason: "Kein Objekt verknüpft",
      };
    }
    return { disabled: false, routeAddress };
  }

  if (kind === "call") {
    const phoneNumber = resolveVorgangPhone(vorgang);
    if (!phoneNumber) {
      return {
        disabled: true,
        disabledReason: "Keine Telefonnummer in Kundenakte",
      };
    }
    return { disabled: false, phoneNumber };
  }

  return { disabled: false };
}

export function resolveHelpyActionExecution(
  action: HelpyAction,
  vorgang: Vorgang
): ResolvedHelpyAction {
  const executionKind = resolveActionKind(action);
  const availability = resolveDisabledState(executionKind, vorgang);

  return {
    ...action,
    executionKind,
    documentFocus:
      executionKind === "document" ? resolveDocumentFocus(action) : undefined,
    ...availability,
  };
}
