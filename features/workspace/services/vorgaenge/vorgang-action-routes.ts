import type { ActionTypeId } from "@/features/review/services/actions/types";
import { getWorkspacePath } from "@/features/workspace/services/workspace";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

const KUNDENAKTE_ACTIONS: ActionTypeId[] = [
  "interessent-anlegen",
  "kunde-anlegen",
  "mandant-anlegen",
];

const BESICHTIGUNG_ACTIONS: ActionTypeId[] = [
  "besichtigung-planen",
  "baustellenbesichtigung-planen",
  "erstgespraech-planen",
  "rueckruf-planen",
];

const EXPOSE_ACTIONS: ActionTypeId[] = ["expose-vorbereiten"];

const DOKUMENT_ACTIONS: ActionTypeId[] = [
  "offerte-vorbereiten",
  "angebot-vorbereiten",
  "dokument-pruefen",
  "materialliste-vorbereiten",
  "frist-sichern",
];

const ANTWORT_ACTIONS: ActionTypeId[] = ["antwort-vorbereiten"];

export function resolveActionRoute(
  actionTypeId: ActionTypeId,
  vorgang: Vorgang
): string | null {
  if (KUNDENAKTE_ACTIONS.includes(actionTypeId)) {
    return `/kunden/akte/${encodeURIComponent(vorgang.id)}`;
  }

  if (BESICHTIGUNG_ACTIONS.includes(actionTypeId)) {
    const focus =
      actionTypeId === "rueckruf-planen" ? "termin" : "besichtigung";
    return `/kalender?vorgang=${encodeURIComponent(vorgang.id)}&focus=${focus}`;
  }

  if (EXPOSE_ACTIONS.includes(actionTypeId)) {
    return `/dokumente?vorgang=${encodeURIComponent(vorgang.id)}&focus=expose`;
  }

  if (DOKUMENT_ACTIONS.includes(actionTypeId)) {
    const focus =
      actionTypeId === "offerte-vorbereiten" || actionTypeId === "angebot-vorbereiten"
        ? "offerte"
        : "dokument";
    return `/dokumente?vorgang=${encodeURIComponent(vorgang.id)}&focus=${focus}`;
  }

  if (ANTWORT_ACTIONS.includes(actionTypeId)) {
    return `${getWorkspacePath(vorgang.id)}?focus=antwort`;
  }

  return null;
}

export function isRoutedAction(actionTypeId: ActionTypeId): boolean {
  return resolveActionRoute(actionTypeId, { id: "probe" } as Vorgang) !== null;
}
