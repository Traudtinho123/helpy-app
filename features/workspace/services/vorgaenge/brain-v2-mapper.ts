import type { BrainIntent } from "@/features/brain/services/brain-v2/types";
import type { PreparedWorkItem } from "@/features/brain/services/brain-v2/types";
import { getWorkItemEmoji } from "@/features/brain/services/brain-v2/brain-engine";
import { BRAIN_INTENT_LABELS } from "@/features/brain/services/brain-v2/types";
import type { Vorgang, VorgangTyp } from "@/features/workspace/services/vorgaenge/types";

const INTENT_TO_VORGANG_TYP: Record<BrainIntent, VorgangTyp> = {
  angebotsanfrage: "angebotsanfrage",
  immobilienanfrage: "anfrage",
  besichtigung: "anfrage",
  rueckruf: "rueckruf",
  terminwunsch: "terminwunsch",
  frist: "frist",
  rechnung: "rechnung",
  dokument: "normale_nachricht",
  mandatsanfrage: "neuer_kunde",
  offertanfrage: "angebotsanfrage",
  normale_nachricht: "normale_nachricht",
};

const BRAIN_STATUS_TO_VORGANG: Record<
  PreparedWorkItem["status"],
  Vorgang["status"]
> = {
  vorbereitet: "neu",
  neu: "neu",
  in_bearbeitung: "in_bearbeitung",
  erledigt: "erledigt",
};

export function mapPreparedWorkItemToVorgang(item: PreparedWorkItem): Vorgang {
  return {
    id: item.id,
    typ: INTENT_TO_VORGANG_TYP[item.intent],
    intent: item.intent,
    intentLabel: BRAIN_INTENT_LABELS[item.intent],
    titel: item.title,
    emoji: getWorkItemEmoji(item),
    kunde: item.customerName,
    quelle: item.sourcePlatform,
    prioritaet: item.priority,
    status: BRAIN_STATUS_TO_VORGANG[item.status],
    summary: item.summary,
    detectedContext: item.detectedContext,
    recommendedNextStep: item.recommendedNextStep,
    preparedActions: item.preparedActions,
    createdObjects: item.createdObjects,
    helpyEmpfehlung: item.helpyMessage,
    helpyMessage: item.helpyMessage,
    receivedAt: item.receivedAt,
    receivedLabel: item.receivedLabel,
    href: item.href,
    kundenAkteId: item.kundenAkteId,
    sourceEventId: item.sourceEventId,
    skill: item.skill,
  };
}

export function mapPreparedWorkItemsToVorgaenge(
  items: PreparedWorkItem[]
): Vorgang[] {
  return items.map(mapPreparedWorkItemToVorgang);
}
