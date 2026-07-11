import { createMockConnectorAdapter, type ConnectorAdapter } from "@/features/platforms/services/connect/connector";
import type { ConnectorId, ConnectorRecord } from "@/features/platforms/services/connect/connector-types";
import { MOCK_CONNECTORS } from "@/features/platforms/services/connect/mock-events";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

const adapters = new Map<ConnectorId, ConnectorAdapter>();
let connectorRecords: ConnectorRecord[] = [];

export function initConnectorRegistry(
  connectors: ConnectorRecord[] = MOCK_CONNECTORS
): void {
  connectorRecords = connectors.map((c) => ({ ...c }));
  adapters.clear();

  for (const record of connectorRecords) {
    adapters.set(record.id, createMockConnectorAdapter(record));
  }
}

export function registerConnectorAdapter(adapter: ConnectorAdapter): void {
  adapters.set(adapter.id, adapter);
  const index = connectorRecords.findIndex((c) => c.id === adapter.id);
  if (index >= 0) {
    connectorRecords[index] = { ...adapter.record };
  } else {
    connectorRecords.push({ ...adapter.record });
  }
}

export function getConnector(id: ConnectorId): ConnectorRecord | undefined {
  return connectorRecords.find((c) => c.id === id);
}

export function getConnectorAdapter(id: ConnectorId): ConnectorAdapter | undefined {
  return adapters.get(id);
}

export function getAllConnectors(): ConnectorRecord[] {
  if (connectorRecords.length === 0) initConnectorRegistry();
  return [...connectorRecords];
}

export function getConnectorsBySkill(skill: HelpySkill): ConnectorRecord[] {
  return getAllConnectors().filter(
    (c) => c.skill === skill || c.skill === "all"
  );
}

export function getConnectedConnectors(): ConnectorRecord[] {
  return getAllConnectors().filter((c) => c.connected);
}

export function updateConnectorRecord(
  id: ConnectorId,
  patch: Partial<ConnectorRecord>
): ConnectorRecord | undefined {
  const index = connectorRecords.findIndex((c) => c.id === id);
  if (index < 0) return undefined;

  connectorRecords[index] = { ...connectorRecords[index], ...patch };
  const adapter = adapters.get(id);
  if (adapter) {
    adapter.record = { ...connectorRecords[index] };
  }
  return connectorRecords[index];
}
