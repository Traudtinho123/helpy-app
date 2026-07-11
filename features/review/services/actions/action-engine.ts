import {
  getActionDefinition,
  SKILL_ACTION_TYPES,
} from "@/features/review/services/actions/action-registry";
import type {
  ActionExecutionResult,
  ActionStatus,
  ActionTypeId,
  PreparedHelpyAction,
} from "@/features/review/services/actions/types";
import { confirmReview } from "@/features/review/services/review-engine";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

const INTENT_ACTION_MAP: Record<string, ActionTypeId[]> = {
  immobilienanfrage: [
    "interessent-anlegen",
    "besichtigung-planen",
    "expose-vorbereiten",
  ],
  besichtigung: ["besichtigung-planen", "interessent-anlegen", "antwort-vorbereiten"],
  rueckruf: ["rueckruf-planen", "antwort-vorbereiten"],
  angebotsanfrage: [
    "angebot-vorbereiten",
    "antwort-vorbereiten",
    "kunde-anlegen",
    "expose-vorbereiten",
    "offerte-vorbereiten",
  ],
  offertanfrage: [
    "offerte-vorbereiten",
    "baustellenbesichtigung-planen",
    "materialliste-vorbereiten",
  ],
  mandatsanfrage: ["mandant-anlegen", "erstgespraech-planen", "antwort-vorbereiten"],
  frist: ["frist-sichern", "dokument-pruefen", "antwort-vorbereiten"],
  dokument: ["dokument-pruefen", "antwort-vorbereiten"],
  terminwunsch: ["besichtigung-planen", "erstgespraech-planen", "antwort-vorbereiten"],
  normale_nachricht: ["antwort-vorbereiten"],
  rechnung: ["dokument-pruefen", "antwort-vorbereiten"],
};

const executedActions = new Map<string, ActionStatus>();

function resolveSkill(vorgang: Vorgang): HelpySkill {
  if (
    vorgang.skill === "real-estate" ||
    vorgang.skill === "construction" ||
    vorgang.skill === "consulting-legal"
  ) {
    return vorgang.skill;
  }

  const intent = vorgang.intent ?? vorgang.typ;
  if (intent === "offertanfrage" || vorgang.typ === "angebotsanfrage") {
    return vorgang.quelle.toLowerCase().includes("formular") ? "construction" : "real-estate";
  }
  if (intent === "frist" || intent === "mandatsanfrage") return "consulting-legal";
  if (
    intent === "immobilienanfrage" ||
    intent === "besichtigung" ||
    vorgang.typ === "anfrage"
  ) {
    return "real-estate";
  }

  return "real-estate";
}

function pickActionTypes(vorgang: Vorgang, skill: HelpySkill): ActionTypeId[] {
  const intent = vorgang.intent ?? vorgang.typ;
  const intentActions = INTENT_ACTION_MAP[intent] ?? [];
  const skillActions = SKILL_ACTION_TYPES[skill];

  const picked: ActionTypeId[] = [];

  for (const actionId of intentActions) {
    if (skillActions.includes(actionId) && !picked.includes(actionId)) {
      picked.push(actionId);
    }
  }

  for (const actionId of skillActions) {
    if (picked.length >= 3) break;
    if (!picked.includes(actionId)) {
      picked.push(actionId);
    }
  }

  return picked.slice(0, 3);
}

function mapVorgangPriority(
  vorgang: Vorgang,
  defaultPriority: PreparedHelpyAction["priority"]
): PreparedHelpyAction["priority"] {
  if (vorgang.prioritaet === "kritisch") return "kritisch";
  if (vorgang.prioritaet === "hoch" && defaultPriority === "niedrig") {
    return "mittel";
  }
  return defaultPriority;
}

export function getPreparedActionsForVorgang(
  vorgang: Vorgang
): PreparedHelpyAction[] {
  const skill = resolveSkill(vorgang);
  const actionTypes = pickActionTypes(vorgang, skill);

  return actionTypes
    .map((actionTypeId) => {
      const definition = getActionDefinition(actionTypeId);
      if (!definition) return null;

      const instanceId = `${vorgang.id}::${actionTypeId}`;
      const storedStatus = executedActions.get(instanceId);

      return {
        instanceId,
        actionTypeId,
        vorgangId: vorgang.id,
        title: definition.title,
        description: definition.description,
        skill,
        priority: mapVorgangPriority(vorgang, definition.defaultPriority),
        status: storedStatus ?? "bereit",
        icon: definition.icon,
        resultAfterExecution: definition.resultAfterExecution,
      } satisfies PreparedHelpyAction;
    })
    .filter((a): a is PreparedHelpyAction => a !== null);
}

export function confirmPreparedAction(
  instanceId: string
): ActionExecutionResult {
  const reviewResult = confirmReview(instanceId);
  executedActions.set(instanceId, "bestaetigt");

  const actionTypeId = instanceId.split("::")[1] as ActionTypeId;
  const definition = getActionDefinition(actionTypeId);

  return {
    instanceId,
    status: "bestaetigt",
    helpyMessage: reviewResult.helpyMessage,
    resultAfterExecution:
      definition?.resultAfterExecution ??
      "Schritt wurde bestätigt — bitte final prüfen.",
  };
}

/** @deprecated Nutze confirmPreparedAction nach Review */
export function executePreparedAction(
  instanceId: string
): ActionExecutionResult {
  return confirmPreparedAction(instanceId);
}

export function getActionStatus(instanceId: string): ActionStatus {
  return executedActions.get(instanceId) ?? "bereit";
}

export function resetActionStates(): void {
  executedActions.clear();
}
