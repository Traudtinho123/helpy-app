export {
  ConnectEventQueue,
  getConnectEngineSnapshot,
  getConnectEventQueue,
  processConnectEventQueue,
  processEventForBrain,
  resetConnectEngine,
  runBrainOnConnectQueue,
  syncAllConnectors,
  syncConnector,
} from "@/features/platforms/services/connect/connect-engine";

export {
  BaseConnector,
  createMockConnectorAdapter,
  MockConnector,
} from "@/features/platforms/services/connect/connector";

export type { ConnectorAdapter, ConnectorFactory } from "@/features/platforms/services/connect/connector";

export {
  getAllConnectors,
  getConnectedConnectors,
  getConnector,
  getConnectorAdapter,
  getConnectorsBySkill,
  initConnectorRegistry,
  registerConnectorAdapter,
  updateConnectorRecord,
} from "@/features/platforms/services/connect/connector-registry";

export {
  CONNECT_EVENT_TYPE_LABELS,
  CONNECTOR_EVENT_TYPES,
  getConnectorEventTypes,
  getEventTypeLabel,
} from "@/features/platforms/services/connect/event-types";

export {
  formatQueueTime,
  getMockEventsByConnector,
  getQueueDisplayLabel,
  MOCK_CONNECT_EVENTS,
  MOCK_CONNECTORS,
} from "@/features/platforms/services/connect/mock-events";

export type {
  BrainQueueItemResult,
  BrainQueueProcessingResult,
  ConnectEngineSnapshot,
  ConnectEvent,
  ConnectEventPayload,
  ConnectEventPriority,
  ConnectEventStatus,
  ConnectEventType,
  ConnectSyncResult,
  ConnectorId,
  ConnectorRecord,
  ConnectorStatus,
} from "@/features/platforms/services/connect/connector-types";
