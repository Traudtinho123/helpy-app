import type { ConnectEvent } from "@/features/platforms/services/connect/connector-types";
import { normalizeIncomingEvent } from "@/features/events/services/event-normalizer";
import {
  getEventStore,
  subscribeEventStore,
} from "@/features/events/services/event-store";
import type {
  EventBusPublishResult,
  HelpyEvent,
  HelpyEventSubscriber,
} from "@/features/events/types/event-types";

type PublishInput = ConnectEvent | HelpyEvent;

const subscribers = new Set<HelpyEventSubscriber>();

/**
 * Zentraler Event Bus — einziger Eingang für Plattform-Events.
 * Brain und andere Consumer abonnieren normalisierte HelpyEvents.
 */
export class EventBus {
  publish(input: PublishInput): EventBusPublishResult {
    const store = getEventStore();
    const normalized = normalizeIncomingEvent(input);
    const duplicate = store.getById(normalized.id) !== undefined;

    if (!duplicate) {
      store.add(normalized);
      subscribers.forEach((listener) => listener(normalized));
    }

    return { event: normalized, duplicate };
  }

  publishMany(inputs: PublishInput[]): HelpyEvent[] {
    return inputs.map((input) => this.publish(input).event);
  }

  /** Legacy: Connect-Schicht publiziert hier — nie direkt an Brain. */
  publishConnectEvent(event: ConnectEvent): EventBusPublishResult {
    return this.publish(event);
  }

  subscribe(listener: HelpyEventSubscriber): () => void {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  }

  getAll(): HelpyEvent[] {
    return getEventStore().getAll();
  }

  getPending(): HelpyEvent[] {
    return getEventStore().getPending();
  }
}

let bus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!bus) bus = new EventBus();
  return bus;
}

export function subscribeEventBus(listener: HelpyEventSubscriber): () => void {
  return getEventBus().subscribe(listener);
}

export { subscribeEventStore };

export function resetEventBus(): void {
  subscribers.clear();
  bus = null;
}
