import type { ConnectEvent } from "@/features/platforms/services/connect/connector-types";
import { getEventStore } from "@/features/events/services/event-store";
import { normalizeConnectEvent, toConnectEvent } from "@/features/events/services/event-normalizer";
import type { HelpyEvent } from "@/features/events/types/event-types";
import { getAllConnectors } from "@/features/platforms/services/connect/connector-registry";
import { buildContext, buildSummary } from "@/features/brain/services/brain-v2/context-builder";
import { matchCustomer } from "@/features/brain/services/brain-v2/customer-matcher";
import { detectIntent, getIntentEmoji } from "@/features/brain/services/brain-v2/intent-detector";
import {
  detectPriority,
  sortByBrainPriority,
} from "@/features/brain/services/brain-v2/priority-detector";
import { createRecommendation } from "@/features/brain/services/brain-v2/recommendation-engine";
import {
  formatReceivedLabel,
  getMockEnrichment,
  INTENT_SKILL_HINTS,
  resolvePlatformName,
} from "@/features/brain/services/brain-v2/mock-brain-results";
import type {
  BrainV2Result,
  BrainV2Summary,
  PreparedWorkItem,
} from "@/features/brain/services/brain-v2/types";
import { BRAIN_V2_PANEL } from "@/features/brain/services/brain-v2/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

function resolveSkill(
  event: ConnectEvent,
  intent: PreparedWorkItem["intent"]
): HelpySkill {
  const connector = getAllConnectors().find((c) => c.id === event.connector);
  if (connector && connector.skill !== "all") {
    return connector.skill;
  }
  return INTENT_SKILL_HINTS[intent] ?? "real-estate";
}

export function processConnectEvent(event: ConnectEvent): PreparedWorkItem {
  return processHelpyEventFromConnect(event);
}

/** Brain-Einstieg — nur HelpyEvent (Connect wird intern gemappt). */
export function processHelpyEvent(event: HelpyEvent): PreparedWorkItem {
  return processHelpyEventCore(event);
}

function processHelpyEventFromConnect(event: ConnectEvent): PreparedWorkItem {
  return processHelpyEventCore(normalizeConnectEvent(event));
}

function processHelpyEventCore(event: HelpyEvent): PreparedWorkItem {
  const connectEvent = toConnectEvent(event);
  const intent = detectIntent(connectEvent);
  const customerMatch = matchCustomer(connectEvent);
  const priority = detectPriority({ event: connectEvent, intent, customerMatch });
  const detectedContext = buildContext({
    event: connectEvent,
    intent,
    customerMatch,
  });
  const summary = buildSummary({
    event: connectEvent,
    intent,
    customerMatch,
    title: connectEvent.title,
  });
  const recommendation = createRecommendation({
    event: connectEvent,
    intent,
    priority,
    customerMatch,
    context: detectedContext,
  });
  const enrichment = getMockEnrichment(connectEvent.id);
  const connectors = getAllConnectors();

  const displayName =
    customerMatch.companyName ?? customerMatch.customerName;

  return {
    id: `pwi-${connectEvent.id}`,
    sourceEventId: connectEvent.id,
    title: connectEvent.title,
    customerName: displayName,
    sourcePlatform: resolvePlatformName(connectEvent.connector, connectors),
    sourceConnectorId: connectEvent.connector,
    skill: resolveSkill(connectEvent, intent),
    intent,
    priority,
    status: enrichment.status ?? "vorbereitet",
    summary,
    detectedContext,
    recommendedNextStep: recommendation.recommendedNextStep,
    preparedActions: recommendation.preparedActions,
    helpyMessage: recommendation.helpyMessage,
    createdObjects: recommendation.createdObjects,
    receivedAt: connectEvent.createdAt,
    receivedLabel: formatReceivedLabel(connectEvent.createdAt),
    href: enrichment.href,
    kundenAkteId: enrichment.kundenAkteId ?? customerMatch.customerId,
  };
}

export function processHelpyEvents(events: HelpyEvent[]): BrainV2Result {
  const items = sortByBrainPriority(events.map(processHelpyEventCore));
  const summary = buildBrainSummary(items);

  return {
    items,
    summary,
    processedAt: "2026-07-07T12:00:00+02:00",
  };
}

export function processConnectEvents(events: ConnectEvent[]): BrainV2Result {
  return processHelpyEvents(events.map(normalizeConnectEvent));
}

export function buildBrainSummary(items: PreparedWorkItem[]): BrainV2Summary {
  return {
    total: items.length,
    kritisch: items.filter((i) => i.priority === "kritisch").length,
    hoch: items.filter((i) => i.priority === "hoch").length,
    mittel: items.filter((i) => i.priority === "mittel").length,
    niedrig: items.filter((i) => i.priority === "niedrig").length,
    neueKunden: items.filter((i) =>
      i.detectedContext.some((c) => c.includes("neuen Kunden"))
    ).length,
    vorbereiteteAngebote: items.filter(
      (i) => i.intent === "angebotsanfrage" || i.intent === "offertanfrage"
    ).length,
    introMessage: BRAIN_V2_PANEL.intro,
    priorityHint: BRAIN_V2_PANEL.priorityHint,
  };
}

let cachedResult: BrainV2Result | null = null;

/** Lädt Events aus Event Store und verarbeitet sie mit Brain v2 */
export function runBrainV2(events?: ConnectEvent[] | HelpyEvent[]): BrainV2Result {
  if (events) {
    if (events.length > 0 && "connector" in events[0]) {
      cachedResult = processConnectEvents(events as ConnectEvent[]);
    } else {
      cachedResult = processHelpyEvents(events as HelpyEvent[]);
    }
    return cachedResult;
  }

  if (cachedResult) return cachedResult;

  const helpyEvents = getEventStore().getAll();
  cachedResult = processHelpyEvents(helpyEvents);
  return cachedResult;
}

export function getBrainV2Items(): PreparedWorkItem[] {
  return runBrainV2().items;
}

export function getBrainV2Summary(): BrainV2Summary {
  return runBrainV2().summary;
}

export function resetBrainV2Cache(): void {
  cachedResult = null;
}

/** Emoji für UI — aus Intent abgeleitet */
export function getWorkItemEmoji(item: PreparedWorkItem): string {
  return getIntentEmoji(item.intent);
}
