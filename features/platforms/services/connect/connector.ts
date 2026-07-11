import type {
  ConnectEvent,
  ConnectSyncResult,
  ConnectorId,
  ConnectorRecord,
} from "@/features/platforms/services/connect/connector-types";

/**
 * Abstrakte Connector-Schnittstelle.
 * Später: echte Implementierungen für Gmail, Outlook, ImmoScout24, …
 * tauschen Mock-Logik gegen API-Clients aus lib/integrations.
 */
export type ConnectorAdapter = {
  id: ConnectorId;
  record: ConnectorRecord;
  /** Simuliert oder führt echten Sync aus — liefert neue Events */
  sync(): Promise<ConnectEvent[]>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
};

export abstract class BaseConnector implements ConnectorAdapter {
  constructor(public record: ConnectorRecord) {}

  get id(): ConnectorId {
    return this.record.id;
  }

  abstract sync(): Promise<ConnectEvent[]>;

  async connect(): Promise<void> {
    this.record.connected = true;
    this.record.status = "connected";
    this.record.lastSync = "2026-07-07T12:00:00+02:00";
  }

  async disconnect(): Promise<void> {
    this.record.connected = false;
    this.record.status = "disconnected";
    this.record.lastSync = null;
  }

  protected createSyncResult(
    newEvents: ConnectEvent[],
    success = true,
    errorMessage?: string
  ): ConnectSyncResult {
    return {
      connectorId: this.id,
      syncedAt: "2026-07-07T12:00:00+02:00",
      newEvents: newEvents.length,
      success,
      errorMessage,
    };
  }
}

/** Mock-Connector — liefert vordefinierte Events beim Sync */
export class MockConnector extends BaseConnector {
  constructor(
    record: ConnectorRecord,
    private pendingEvents: ConnectEvent[] = []
  ) {
    super(record);
  }

  setPendingEvents(events: ConnectEvent[]): void {
    this.pendingEvents = [...events];
  }

  async sync(): Promise<ConnectEvent[]> {
    this.record.status = "syncing";

    await new Promise((resolve) => setTimeout(resolve, 50));

    const events = [...this.pendingEvents];
    this.pendingEvents = [];
    this.record.status = "connected";
    this.record.lastSync = "2026-07-07T12:00:00+02:00";
    this.record.eventCount += events.length;

    return events;
  }
}

/**
 * Factory für zukünftige echte Adapter.
 * Beispiel: createGmailConnectorAdapter() → Gmail API + OAuth
 */
export type ConnectorFactory = () => ConnectorAdapter;

export function createMockConnectorAdapter(
  record: ConnectorRecord,
  events: ConnectEvent[] = []
): MockConnector {
  return new MockConnector(record, events);
}
