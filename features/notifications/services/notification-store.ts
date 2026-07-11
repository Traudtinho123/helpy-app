import type {
  GroupedHelpyNotifications,
  HelpyNotification,
  NotificationTimeGroup,
} from "@/features/notifications/types/notification-types";

const STORAGE_KEY = "helpy-notification-center-v1";

const listeners = new Set<() => void>();

let notifications: HelpyNotification[] = [];
let sessionHydrated = false;

export type NotificationBellSnapshot = {
  unreadCount: number;
  grouped: GroupedHelpyNotifications[];
  hasNotifications: boolean;
};

const NOTIFICATION_BELL_SERVER_SNAPSHOT: NotificationBellSnapshot = {
  unreadCount: 0,
  grouped: [],
  hasNotifications: false,
};

let notificationBellSnapshot: NotificationBellSnapshot =
  NOTIFICATION_BELL_SERVER_SNAPSHOT;

function recomputeNotificationBellSnapshot(now = new Date()): void {
  const grouped = buildGroupedNotifications(now);
  const unreadCount = notifications.filter(
    (item) => !item.read && resolveTimeGroup(item.createdAt, now) !== null
  ).length;

  notificationBellSnapshot = {
    unreadCount,
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
}

export function markAllNotificationsRead(): void {
  hydrateFromSession();

  if (notifications.every((item) => item.read)) return;

  notifications = notifications.map((item) => ({ ...item, read: true }));
  persistToSession();
  notify();
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
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}
