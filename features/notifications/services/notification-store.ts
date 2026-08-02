import type {
  GroupedHelpyNotifications,
  HelpyNotification,
  NotificationTimeGroup,
} from "@/features/notifications/types/notification-types";
import {
  mapDbNotificationToHelpy,
  mapHelpyNotificationToDbPayload,
} from "@/features/notifications/services/notification-mapper";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const STORAGE_KEY = "helpy-notification-center-v2";

const listeners = new Set<() => void>();

let notifications: HelpyNotification[] = [];
let sessionHydrated = false;
let companyId: string | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let fetchInFlight: Promise<void> | null = null;

export type NotificationBellSnapshot = {
  unreadCount: number;
  unreadImportantCount: number;
  badgeTone: "none" | "normal" | "important";
  grouped: GroupedHelpyNotifications[];
  hasNotifications: boolean;
};

const NOTIFICATION_BELL_SERVER_SNAPSHOT: NotificationBellSnapshot = {
  unreadCount: 0,
  unreadImportantCount: 0,
  badgeTone: "none",
  grouped: [],
  hasNotifications: false,
};

let notificationBellSnapshot: NotificationBellSnapshot =
  NOTIFICATION_BELL_SERVER_SNAPSHOT;

function recomputeNotificationBellSnapshot(now = new Date()): void {
  const grouped = buildGroupedNotifications(now);
  const unread = notifications.filter(
    (item) => !item.read && resolveTimeGroup(item.createdAt, now) !== null
  );
  const unreadCount = unread.length;
  const unreadImportantCount = unread.filter(
    (item) => item.priority === "wichtig"
  ).length;

  notificationBellSnapshot = {
    unreadCount,
    unreadImportantCount,
    badgeTone:
      unreadImportantCount > 0
        ? "important"
        : unreadCount > 0
          ? "normal"
          : "none",
    grouped,
    hasNotifications: grouped.length > 0,
  };
}

function notify(): void {
  recomputeNotificationBellSnapshot();
  listeners.forEach((listener) => listener());
}

function hydrateFromSession(): void {
  if (typeof window === "undefined" || sessionHydrated) return;

  sessionHydrated = true;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      notifications = JSON.parse(raw) as HelpyNotification[];
    }
  } catch {
    notifications = [];
  }

  recomputeNotificationBellSnapshot();
}

function persistToSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

function upsertNotification(notification: HelpyNotification): boolean {
  if (notifications.some((item) => item.id === notification.id)) {
    return false;
  }

  notifications = [notification, ...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  persistToSession();
  notify();
  return true;
}

function replaceNotifications(next: HelpyNotification[]): void {
  notifications = next.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  persistToSession();
  notify();
}

async function persistNotificationToServer(
  notification: HelpyNotification
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        typ: notification.kind,
        titel: notification.title,
        beschreibung: notification.message,
        link: notification.href,
        prioritaet: notification.priority,
      }),
    });

    if (!response.ok) return;

    const payload = (await response.json()) as {
      notification?: {
        id: string;
        typ: string;
        titel: string;
        beschreibung: string | null;
        link: string | null;
        gelesen: boolean;
        prioritaet: HelpyNotification["priority"];
        created_at: string;
        company_id: string;
      };
    };

    if (!payload.notification) return;

    const mapped = mapDbNotificationToHelpy(payload.notification);
    notifications = notifications.filter((item) => item.id !== notification.id);
    upsertNotification(mapped);
  } catch {
    // Offline / dev — lokale Notification bleibt sichtbar
  }
}

async function fetchNotificationsFromServer(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;

    const payload = (await response.json()) as {
      notifications?: Array<{
        id: string;
        typ: string;
        titel: string;
        beschreibung: string | null;
        link: string | null;
        gelesen: boolean;
        prioritaet: HelpyNotification["priority"];
        created_at: string;
        company_id: string;
      }>;
    };

    if (!payload.notifications) return;

    replaceNotifications(payload.notifications.map(mapDbNotificationToHelpy));
  } catch {
    // Session-Cache bleibt Fallback
  }
}

function subscribeRealtime(nextCompanyId: string): void {
  const supabase = createClient();
  if (!supabase) return;

  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  realtimeChannel = supabase
    .channel(`notifications:${nextCompanyId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `company_id=eq.${nextCompanyId}`,
      },
      () => {
        void fetchNotificationsFromServer();
      }
    )
    .subscribe();
}

export function initNotificationStore(nextCompanyId: string): void {
  if (typeof window === "undefined") return;
  if (companyId === nextCompanyId && fetchInFlight) return;

  companyId = nextCompanyId;
  hydrateFromSession();

  fetchInFlight = fetchNotificationsFromServer().finally(() => {
    fetchInFlight = null;
  });

  subscribeRealtime(nextCompanyId);
}

export function teardownNotificationStore(): void {
  const supabase = createClient();
  if (supabase && realtimeChannel) {
    void supabase.removeChannel(realtimeChannel);
  }
  realtimeChannel = null;
  companyId = null;
}

export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNotificationsSnapshot(): HelpyNotification[] {
  hydrateFromSession();
  return notifications.map((item) => ({ ...item }));
}

export function getNotificationsServerSnapshot(): HelpyNotification[] {
  return [];
}

export function getNotificationBellSnapshot(): NotificationBellSnapshot {
  hydrateFromSession();
  return notificationBellSnapshot;
}

export function getNotificationBellServerSnapshot(): NotificationBellSnapshot {
  return NOTIFICATION_BELL_SERVER_SNAPSHOT;
}

export function getUnreadNotificationCount(): number {
  hydrateFromSession();
  return notificationBellSnapshot.unreadCount;
}

export function pushNotification(notification: HelpyNotification): boolean {
  hydrateFromSession();

  const normalized: HelpyNotification = {
    ...notification,
    priority: notification.priority ?? "normal",
  };

  const added = upsertNotification(normalized);
  if (added) {
    void persistNotificationToServer(normalized);
  }
  return added;
}

export function markNotificationRead(id: string): void {
  hydrateFromSession();

  const next = notifications.map((item) =>
    item.id === id ? { ...item, read: true } : item
  );

  if (next.every((item, index) => item.read === notifications[index]?.read)) {
    return;
  }

  notifications = next;
  persistToSession();
  notify();

  void fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead(): void {
  hydrateFromSession();

  if (notifications.every((item) => item.read)) return;

  notifications = notifications.map((item) => ({ ...item, read: true }));
  persistToSession();
  notify();

  void fetch("/api/notifications/read-all", { method: "POST" });
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function resolveTimeGroup(
  createdAt: string,
  now = new Date()
): NotificationTimeGroup | null {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;

  const today = startOfDay(now);
  const createdDay = startOfDay(created);
  const diffDays = Math.floor(
    (today.getTime() - createdDay.getTime()) / 86_400_000
  );

  if (diffDays === 0) return "heute";
  if (diffDays === 1) return "gestern";

  const weekStart = new Date(today);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + mondayOffset);

  if (createdDay >= weekStart && createdDay < today) {
    return "diese_woche";
  }

  return null;
}

const GROUP_LABELS: Record<NotificationTimeGroup, string> = {
  heute: "Heute",
  gestern: "Gestern",
  diese_woche: "Diese Woche",
};

const GROUP_ORDER: NotificationTimeGroup[] = [
  "heute",
  "gestern",
  "diese_woche",
];

function buildGroupedNotifications(
  now = new Date()
): GroupedHelpyNotifications[] {
  const grouped = new Map<NotificationTimeGroup, HelpyNotification[]>();

  for (const item of notifications) {
    const group = resolveTimeGroup(item.createdAt, now);
    if (!group) continue;

    const bucket = grouped.get(group) ?? [];
    bucket.push(item);
    grouped.set(group, bucket);
  }

  return GROUP_ORDER.filter((group) => grouped.has(group)).map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: grouped.get(group) ?? [],
  }));
}

export function getGroupedNotifications(): GroupedHelpyNotifications[] {
  hydrateFromSession();
  return notificationBellSnapshot.grouped;
}

export function clearNotificationStore(): void {
  notifications = [];
  sessionHydrated = false;
  companyId = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem("helpy-notification-center-v1");
  }
  teardownNotificationStore();
  notify();
}

export { mapHelpyNotificationToDbPayload };
