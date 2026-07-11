import { disconnectAppleCalendar } from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  MOCK_INTEGRATIONS,
  NEXT_RECOMMENDED_INTEGRATION_ID,
} from "@/features/integration-manager/mock/mock-integrations";
import type {
  IntegrationAction,
  IntegrationCategory,
  IntegrationRecord,
  IntegrationSummary,
} from "@/features/integration-manager/types/integration-types";
import { getUserPersonalPlatformConnections } from "@/lib/user/services/user-profile-service";

const listeners = new Set<() => void>();

let integrations: IntegrationRecord[] = MOCK_INTEGRATIONS.map((item) => ({
  ...item,
  enabledFeatures: [...item.enabledFeatures],
}));

export function subscribeIntegrations(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getIntegrations(): IntegrationRecord[] {
  return integrations.map((item) => ({
    ...item,
    enabledFeatures: [...item.enabledFeatures],
  }));
}

export function getIntegrationById(id: string): IntegrationRecord | undefined {
  return getIntegrations().find((item) => item.id === id);
}

export function getIntegrationsByCategory(): Map<
  IntegrationCategory,
  IntegrationRecord[]
> {
  const map = new Map<IntegrationCategory, IntegrationRecord[]>();

  for (const integration of getIntegrations()) {
    const list = map.get(integration.category) ?? [];
    list.push(integration);
    map.set(integration.category, list);
  }

  return map;
}

export function getIntegrationSummary(): IntegrationSummary {
  const all = getIntegrations();
  const connected = all.filter((i) => i.connected);
  const nextRecommended =
    all.find((i) => i.id === NEXT_RECOMMENDED_INTEGRATION_ID) ?? null;

  return {
    connectedCount: connected.length,
    eventsTodayTotal: all.reduce((sum, i) => sum + i.eventsToday, 0),
    warningCount: all.filter((i) => i.health === "warnung").length,
    nextRecommended,
  };
}

function integrationPatchEqual(
  current: IntegrationRecord,
  patch: Partial<IntegrationRecord>
): boolean {
  return (Object.keys(patch) as Array<keyof IntegrationRecord>).every(
    (key) => current[key] === patch[key]
  );
}

function updateIntegration(
  id: string,
  patch: Partial<IntegrationRecord>
): boolean {
  const current = integrations.find((item) => item.id === id);
  if (!current) return false;

  if (integrationPatchEqual(current, patch)) {
    return false;
  }

  integrations = integrations.map((item) =>
    item.id === id ? { ...item, ...patch } : item
  );
  return true;
}

function notifyIntegrations(): void {
  listeners.forEach((listener) => listener());
}

/** Mock-Aktionen — keine echten APIs. */
export function runIntegrationAction(
  id: string,
  action: IntegrationAction
): void {
  const current = integrations.find((i) => i.id === id);
  if (!current || current.status === "bald_verfuegbar") return;

  let changed = false;
  const apply = (integrationId: string, patch: Partial<IntegrationRecord>) => {
    if (updateIntegration(integrationId, patch)) {
      changed = true;
    }
  };

  switch (action) {
    case "connect":
    case "reconnect":
      if (id === "google-calendar") {
        disconnectAppleCalendar();
        apply("apple-calendar", {
          status: "nicht_verbunden",
          connected: false,
          accountEmail: null,
          lastSync: null,
          tokenStatus: "fehlt",
          eventsToday: 0,
          health: "offline",
          errorMessage: null,
          enabledFeatures: [],
          eventBusActive: false,
          helpyProcessingActive: false,
        });
      }
      apply(id, {
        status: "verbunden",
        connected: true,
        accountEmail: current.accountEmail ?? "martina@gmail.com",
        lastSync: "gerade eben",
        tokenStatus: "gueltig",
        health: "online",
        errorMessage: null,
        eventBusActive: true,
        helpyProcessingActive: true,
        enabledFeatures:
          current.enabledFeatures.length > 0
            ? current.enabledFeatures
            : ["Eingänge", "Vorgänge vorbereiten"],
      });
      break;
    case "sync":
      if (!current.connected) return;
      apply(id, {
        lastSync: "gerade eben",
        health: "online",
        errorMessage: null,
      });
      break;
    case "check":
      apply(id, {
        lastSync: current.connected ? "gerade eben" : current.lastSync,
        health: current.connected ? "online" : "offline",
        status: current.connected ? "verbunden" : "nicht_verbunden",
        errorMessage: null,
      });
      break;
    case "disconnect":
      apply(id, {
        status: "nicht_verbunden",
        connected: false,
        accountEmail: null,
        lastSync: null,
        tokenStatus: "fehlt",
        eventsToday: 0,
        health: "offline",
        errorMessage: null,
        enabledFeatures: [],
        eventBusActive: false,
        helpyProcessingActive: false,
      });
      break;
  }

  if (changed) {
    notifyIntegrations();
  }
}

export function connectOutlookIntegration(options: {
  accountEmail: string;
  messagesToday?: number;
}): void {
  const changed = updateIntegration("outlook", {
    status: "verbunden",
    connected: true,
    accountEmail: options.accountEmail,
    lastSync: "gerade eben",
    tokenStatus: "gueltig",
    health: "online",
    eventsToday: options.messagesToday ?? 0,
    errorMessage: null,
    eventBusActive: true,
    helpyProcessingActive: true,
    enabledFeatures: ["Posteingang", "Antworten", "Vorgänge vorbereiten"],
  });

  if (changed) {
    notifyIntegrations();
  }
}

export function disconnectOutlookIntegration(): void {
  const changed = updateIntegration("outlook", {
    status: "nicht_verbunden",
    connected: false,
    accountEmail: null,
    lastSync: null,
    tokenStatus: "fehlt",
    eventsToday: 0,
    health: "offline",
    errorMessage: null,
    enabledFeatures: [],
    eventBusActive: false,
    helpyProcessingActive: false,
  });

  if (changed) {
    notifyIntegrations();
  }
}

export function updateOutlookSyncMeta(options: {
  accountEmail: string;
  messagesToday: number;
  lastSyncAt: string;
  lastError?: string | null;
}): void {
  const changed = updateIntegration("outlook", {
    status: options.lastError ? "fehler" : "verbunden",
    connected: !options.lastError,
    accountEmail: options.accountEmail,
    lastSync: formatRelativeSyncLabel(options.lastSyncAt),
    tokenStatus: options.lastError ? "abgelaufen" : "gueltig",
    health: options.lastError ? "warnung" : "online",
    eventsToday: options.messagesToday,
    errorMessage: options.lastError ?? null,
    eventBusActive: !options.lastError,
    helpyProcessingActive: !options.lastError,
    enabledFeatures: ["Posteingang", "Antworten", "Vorgänge vorbereiten"],
  });

  if (changed) {
    notifyIntegrations();
  }
}

/** Mock-Verbindung für Apple Kalender — ohne Passwort-Speicherung. */
export function connectAppleCalendarIntegration(options: {
  accountEmail: string;
  calendarName: string;
  eventsToday: number;
}): void {
  let changed = false;

  if (
    updateIntegration("google-calendar", {
      status: "nicht_verbunden",
      connected: false,
      accountEmail: null,
      lastSync: null,
      tokenStatus: "fehlt",
      eventsToday: 0,
      health: "offline",
      errorMessage: null,
      enabledFeatures: [],
      eventBusActive: false,
      helpyProcessingActive: false,
    })
  ) {
    changed = true;
  }

  if (
    updateIntegration("apple-calendar", {
      status: "verbunden",
      connected: true,
      accountEmail: options.accountEmail,
      lastSync: "gerade eben",
      tokenStatus: "gueltig",
      health: "online",
      eventsToday: options.eventsToday,
      errorMessage: null,
      eventBusActive: true,
      helpyProcessingActive: true,
      enabledFeatures: ["Termine", "Erinnerungen"],
    })
  ) {
    changed = true;
  }

  if (changed) {
    notifyIntegrations();
  }
}

/** Aktualisiert Apple-Kalender Metadaten nach Live-Sync. */
export function updateAppleCalendarSyncMeta(options: {
  accountEmail: string;
  calendarName: string;
  eventsToday: number;
  calendarsFound: number;
  lastSyncAt: string | null;
}): void {
  const changed = updateIntegration("apple-calendar", {
    status: "verbunden",
    connected: true,
    accountEmail: options.accountEmail,
    lastSync: formatRelativeSyncLabel(options.lastSyncAt),
    tokenStatus: "gueltig",
    health: "online",
    eventsToday: options.eventsToday,
    errorMessage: null,
    eventBusActive: true,
    helpyProcessingActive: true,
    enabledFeatures: ["Termine lesen", options.calendarName],
  });

  if (changed) {
    notifyIntegrations();
  }
}

function formatRelativeSyncLabel(isoDate: string | null): string {
  if (!isoDate) return "gerade eben";

  const date = new Date(isoDate);
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60_000));

  if (diffMinutes < 2) return "gerade eben";
  if (diffMinutes < 60) return `vor ${diffMinutes} Minuten`;

  const diffHours = Math.round(diffMinutes / 60);
  return `vor ${diffHours} Stunden`;
}

export function resetIntegrations(): void {
  integrations = MOCK_INTEGRATIONS.map((item) => ({
    ...item,
    enabledFeatures: [...item.enabledFeatures],
  }));
  notifyIntegrations();
}

/** Nutzer-Labels für interne Zustände (kein Technik-Jargon). */
export function getAccessLabel(
  tokenStatus: IntegrationRecord["tokenStatus"]
): string {
  switch (tokenStatus) {
    case "gueltig":
      return "Zugriff gültig";
    case "abgelaufen":
      return "Zugriff erneuern";
    default:
      return "Kein Zugriff";
  }
}

export function getProcessingLabel(integration: IntegrationRecord): string {
  if (integration.helpyProcessingActive && integration.eventBusActive) {
    return "Verarbeitung aktiv";
  }
  if (integration.connected) {
    return "Verbindung aktiv";
  }
  return "Inaktiv";
}

/** Persönliche Verbindungen des eingeloggten Users auf Integrations-Karten spiegeln. */
export function syncIntegrationsFromUserProfile(): void {
  const connections = getUserPersonalPlatformConnections();
  let changed = false;

  for (const connection of connections) {
    const current = integrations.find((item) => item.id === connection.platformId);
    if (!current) continue;

    if (
      updateIntegration(connection.platformId, {
        connected: connection.connected,
        accountEmail: connection.accountEmail,
        lastSync: connection.lastSync,
        status: connection.connected ? "verbunden" : "nicht_verbunden",
        tokenStatus: connection.connected ? "gueltig" : "fehlt",
        health: connection.connected ? "online" : "offline",
        eventBusActive: connection.connected,
        helpyProcessingActive: connection.connected,
      })
    ) {
      changed = true;
    }
  }

  if (changed) {
    notifyIntegrations();
  }
}
