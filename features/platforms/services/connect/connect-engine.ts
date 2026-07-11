import {
  getAllConnectors,
  getConnectorAdapter,
  initConnectorRegistry,
} from "@/features/platforms/services/connect/connector-registry";
import type {
  BrainQueueProcessingResult,
  ConnectEngineSnapshot,
  ConnectEvent,
  ConnectSyncResult,
  ConnectorId,
} from "@/features/platforms/services/connect/connector-types";
import {
  getMockEventsByConnector,
  MOCK_CONNECT_EVENTS,
} from "@/features/platforms/services/connect/mock-events";
import { getEventBus, resetEventBus } from "@/features/events/services/event-bus";
import { resetEventStore } from "@/features/events/services/event-store";
import { runBrainViaEventBus, resetEventRouter } from "@/features/events/services/event-router";
import { processEventForBrain } from "@/features/events/services/brain-v1-handler";

// ---------------------------------------------------------------------------
// HELPY Event Queue
// ---------------------------------------------------------------------------

export class ConnectEventQueue {
  private events: ConnectEvent[] = [];

  enqueue(event: ConnectEvent): void {
    const exists = this.events.some((e) => e.id === event.id);
    if (!exists) {
      this.events.push({ ...event, status: "neu" });
      getEventBus().publishConnectEvent({ ...event, status: "neu" });
    }
  }

  enqueueMany(events: ConnectEvent[]): void {
    for (const event of events) {
      this.enqueue(event);
    }
  }

  /** Nach createdAt sortiert — älteste zuerst */
  getAll(): ConnectEvent[] {
    return [...this.events].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  }

  getPending(): ConnectEvent[] {
    return this.getAll().filter((e) => e.status === "neu");
  }

  getById(id: string): ConnectEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  markProcessing(id: string): void {
    const event = this.events.find((e) => e.id === id);
    if (event) event.status = "in-verarbeitung";
  }

  markProcessed(id: string): void {
    const event = this.events.find((e) => e.id === id);
    if (event) event.status = "verarbeitet";
  }

  clear(): void {
    this.events = [];
  }

  get pendingCount(): number {
    return this.getPending().length;
  }

  get totalCount(): number {
    return this.events.length;
  }
}

// ---------------------------------------------------------------------------
// Brain-Verarbeitung — über Event Bus → Router (kein Direktzugriff)
// ---------------------------------------------------------------------------

export function processConnectEventQueue(
  _queue: ConnectEventQueue
): BrainQueueProcessingResult {
  return runBrainViaEventBus();
}

// ---------------------------------------------------------------------------
// Connect Engine
// ---------------------------------------------------------------------------

let initialized = false;
const eventQueue = new ConnectEventQueue();

function ensureInitialized(): void {
  if (initialized) return;

  initConnectorRegistry();

  const eventsByConnector = getMockEventsByConnector();
  for (const [connectorId, events] of eventsByConnector) {
    const adapter = getConnectorAdapter(connectorId);
    if (adapter && "setPendingEvents" in adapter) {
      (adapter as { setPendingEvents: (e: ConnectEvent[]) => void }).setPendingEvents(
        events
      );
    }
  }

  eventQueue.enqueueMany(MOCK_CONNECT_EVENTS);
  initialized = true;
}

export function getConnectEventQueue(): ConnectEventQueue {
  ensureInitialized();
  return eventQueue;
}

export async function syncConnector(
  connectorId: ConnectorId
): Promise<ConnectSyncResult> {
  ensureInitialized();

  const adapter = getConnectorAdapter(connectorId);
  if (!adapter) {
    return {
      connectorId,
      syncedAt: "2026-07-07T12:00:00+02:00",
      newEvents: 0,
      success: false,
      errorMessage: `Connector "${connectorId}" nicht registriert.`,
    };
  }

  try {
    const events = await adapter.sync();
    eventQueue.enqueueMany(events);
    return {
      connectorId,
      syncedAt: "2026-07-07T12:00:00+02:00",
      newEvents: events.length,
      success: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Synchronisation fehlgeschlagen";
    return {
      connectorId,
      syncedAt: "2026-07-07T12:00:00+02:00",
      newEvents: 0,
      success: false,
      errorMessage: message,
    };
  }
}

export async function syncAllConnectors(): Promise<ConnectSyncResult[]> {
  ensureInitialized();
  const connectors = getAllConnectors().filter((c) => c.connected);
  return Promise.all(connectors.map((c) => syncConnector(c.id)));
}

export function runBrainOnConnectQueue(): BrainQueueProcessingResult {
  ensureInitialized();
  const result = runBrainViaEventBus();

  for (const item of result.results) {
    eventQueue.markProcessed(item.eventId);
  }

  return result;
}

export function getConnectEngineSnapshot(): ConnectEngineSnapshot {
  ensureInitialized();

  const queue = eventQueue.getAll();
  const processedToday = queue.filter((e) => e.status === "verarbeitet").length;

  return {
    connectors: getAllConnectors(),
    queue,
    pendingCount: eventQueue.pendingCount,
    processedToday,
  };
}

export function resetConnectEngine(): void {
  initialized = false;
  eventQueue.clear();
  resetEventStore();
  resetEventBus();
  resetEventRouter();
  ensureInitialized();
}

export { processEventForBrain } from "@/features/events/services/brain-v1-handler";
