import type { CalendarEvent } from "@/features/calendar/mock/mock-calendar";
import {
  computeFreeSlots,
  parseTimeToMinutes,
} from "@/features/calendar/services/availability-engine";
import { getTodayDateString } from "@/features/calendar/services/calendar-events-store";
import {
  buildTodayImportantItems,
  buildHelpyTasksFromVorgaenge,
} from "@/features/calendar/services/calendar-vorgang-tasks";

export type CalendarFreeTimeWindow = {
  from: string;
  to: string;
} | null;

export type CalendarInsights = {
  todayImportant: ReturnType<typeof buildTodayImportantItems>;
  freeTime: CalendarFreeTimeWindow;
  detected: string[];
  suggestion: string;
  helpyTaskCount: number;
};

function findLargestFreeWindow(events: CalendarEvent[]): CalendarFreeTimeWindow {
  const today = getTodayDateString();
  const todayEvents = events
    .filter((e) => e.date === today && e.type !== "helpy_aufgabe")
    .sort((a, b) => a.time.localeCompare(b.time));

  const slots = computeFreeSlots({
    date: today,
    existingEvents: todayEvents.map((e) => ({
      start: e.time,
      end: e.endTime,
    })),
    durationMinutes: 30,
    bufferMinutes: 0,
    workingHours: { start: "08:00", end: "18:00" },
    maxSlots: 20,
  });

  if (slots.length === 0) return null;

  let best = slots[0];
  let bestDuration =
    parseTimeToMinutes(best.end) - parseTimeToMinutes(best.start);

  for (const slot of slots.slice(1)) {
    const duration =
      parseTimeToMinutes(slot.end) - parseTimeToMinutes(slot.start);
    if (duration > bestDuration) {
      best = slot;
      bestDuration = duration;
    }
  }

  if (bestDuration < 45) return null;

  return { from: best.start, to: best.end };
}

export function buildCalendarInsights(allEvents: CalendarEvent[]): CalendarInsights {
  const helpyTasks = buildHelpyTasksFromVorgaenge(allEvents);
  const todayImportant = buildTodayImportantItems();
  const freeTime = findLargestFreeWindow(allEvents);

  const platformEvents = allEvents.filter((e) => e.type !== "helpy_aufgabe");
  const emailEvents = platformEvents.filter((e) => e.sourceEmailId).length;
  const offerEvents = platformEvents.filter((e) => e.type === "angebot").length;
  const overdueTasks = helpyTasks.filter((t) => t.title.startsWith("⚡")).length;

  const detected: string[] = [];
  if (emailEvents > 0) {
    detected.push(
      `${emailEvents} Termin${emailEvents === 1 ? "" : "e"} stammen aus E-Mails`
    );
  }
  if (offerEvents > 0) {
    detected.push(
      `${offerEvents} Termin${offerEvents === 1 ? "" : "e"} enthält Angebotsbezug`
    );
  }
  if (overdueTasks > 0) {
    detected.push(`${overdueTasks} überfällige Antwort${overdueTasks === 1 ? "" : "en"}`);
  }
  if (detected.length === 0) {
    detected.push("Keine besonderen Muster erkannt.");
  }

  const firstUrgent = todayImportant[0];
  const suggestion = firstUrgent
    ? `Wenn du „${firstUrgent.label}“ zuerst erledigst, bleibt der Rest des Tages entspannter.`
    : "Du hast heute keine dringenden HELPY-Aufgaben — guter Tag für Planung.";

  return {
    todayImportant,
    freeTime,
    detected,
    suggestion,
    helpyTaskCount: helpyTasks.length,
  };
}
