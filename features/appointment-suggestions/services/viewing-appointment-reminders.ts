import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { pushNotification } from "@/features/notifications/services/notification-store";
import type { HelpyNotification } from "@/features/notifications/types/notification-types";
import { getWorkspacePath } from "@/features/workspace/services/workspace";

const STORAGE_KEY = "helpy-viewing-reminders-v1";

type ScheduledViewingReminder = {
  id: string;
  vorgangId: string;
  fireAt: string;
  kind: "24h" | "1h";
  title: string;
  message: string;
  fired: boolean;
};

let reminders: ScheduledViewingReminder[] = [];
let intervalId: ReturnType<typeof setInterval> | null = null;

function loadReminders(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    reminders = raw ? (JSON.parse(raw) as ScheduledViewingReminder[]) : [];
  } catch {
    reminders = [];
  }
}

function saveReminders(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

function buildReminderNotification(
  reminder: ScheduledViewingReminder
): HelpyNotification {
  return {
    id: reminder.id,
    kind: "kalender_termin",
    title: reminder.title,
    message: reminder.message,
    vorgangId: reminder.vorgangId,
    href: getWorkspacePath(reminder.vorgangId),
    createdAt: new Date().toISOString(),
    read: false,
  };
}

function fireDueReminders(): void {
  const now = Date.now();
  let changed = false;

  for (const reminder of reminders) {
    if (reminder.fired) continue;
    if (new Date(reminder.fireAt).getTime() > now) continue;

    pushNotification(buildReminderNotification(reminder));
    reminder.fired = true;
    changed = true;
  }

  if (changed) {
    reminders = reminders.filter((item) => {
      if (!item.fired) return true;
      return Date.now() - new Date(item.fireAt).getTime() < 48 * 60 * 60 * 1000;
    });
    saveReminders();
  }
}

export function ensureViewingReminderScheduler(): void {
  if (typeof window === "undefined") return;
  loadReminders();
  if (intervalId) return;
  fireDueReminders();
  intervalId = setInterval(fireDueReminders, 60_000);
}

function slotToDate(slot: AppointmentSlot): Date {
  const [year, month, day] = slot.date.split("-").map(Number);
  const [hours, minutes] = slot.start.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function scheduleViewingAppointmentReminders(input: {
  vorgangId: string;
  objekt: string;
  customer: string;
  slot: AppointmentSlot;
}): void {
  if (typeof window === "undefined") return;
  loadReminders();

  const appointmentAt = slotToDate(input.slot);
  const now = Date.now();

  const entries: Array<{
    kind: "24h" | "1h";
    offsetMs: number;
    title: string;
    message: string;
  }> = [
    {
      kind: "24h",
      offsetMs: 24 * 60 * 60 * 1000,
      title: "Besichtigung morgen",
      message: `Morgen: Besichtigung ${input.objekt} um ${input.slot.start} Uhr mit ${input.customer}`,
    },
    {
      kind: "1h",
      offsetMs: 60 * 60 * 1000,
      title: "Besichtigung in 1 Stunde",
      message: `In 1 Stunde: Besichtigung ${input.objekt}`,
    },
  ];

  for (const entry of entries) {
    const fireAt = new Date(appointmentAt.getTime() - entry.offsetMs);
    if (fireAt.getTime() <= now) continue;

    const id = `viewing-reminder-${input.vorgangId}-${entry.kind}`;
    if (reminders.some((item) => item.id === id)) continue;

    reminders.push({
      id,
      vorgangId: input.vorgangId,
      fireAt: fireAt.toISOString(),
      kind: entry.kind,
      title: entry.title,
      message: entry.message,
      fired: false,
    });
  }

  saveReminders();
  ensureViewingReminderScheduler();
}

export function cancelViewingAppointmentReminders(vorgangId: string): void {
  if (typeof window === "undefined") return;
  loadReminders();
  reminders = reminders.filter((item) => item.vorgangId !== vorgangId);
  saveReminders();
}
