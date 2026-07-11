import type { BrainQueueProcessingResult } from "@/features/platforms/services/connect/connector-types";
import { processEventForBrain } from "@/features/events/services/brain-v1-handler";
import { getEventStore } from "@/features/events/services/event-store";
import { toConnectEvent } from "@/features/events/services/event-normalizer";
import type { HelpyEvent } from "@/features/events/types/event-types";
import {
  processHelpyEvent,
  processHelpyEvents,
} from "@/features/brain/services/brain-v2/brain-engine";

/**
 * Leitet normalisierte Events an Brain v1/v2 weiter.
 * Plattformen sprechen nie direkt mit dem Brain.
 */
export class EventRouter {
  routeToBrainV2(events?: HelpyEvent[]) {
    const source = events ?? getEventStore().getAll();
    return processHelpyEvents(source);
  }

  routeToBrainV1Queue(): BrainQueueProcessingResult {
    const store = getEventStore();
    const pending = store.getPending();
    const results = [];

    for (const event of pending) {
      store.updateStatus(event.id, "in-verarbeitung");
      results.push(processEventForBrain(toConnectEvent(event)));
      store.updateStatus(event.id, "verarbeitet");
    }

    const summary =
      results.length === 0
        ? "Keine neuen Ereignisse in der Queue."
        : results.length === 1
          ? "1 Ereignis verarbeitet — Vorgang kann vorbereitet werden."
          : `${results.length} Ereignisse verarbeitet — Vorgänge können vorbereitet werden.`;

    return {
      processedCount: results.length,
      results,
      queueRemaining: store.pendingCount,
      summary,
    };
  }

  routeSingleToBrainV2(event: HelpyEvent) {
    return processHelpyEvent(event);
  }
}

let router: EventRouter | null = null;

export function getEventRouter(): EventRouter {
  if (!router) router = new EventRouter();
  return router;
}

export function runBrainViaEventBus(): BrainQueueProcessingResult {
  return getEventRouter().routeToBrainV1Queue();
}

export function resetEventRouter(): void {
  router = null;
}
