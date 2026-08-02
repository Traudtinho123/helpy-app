import { getAppointmentSuggestion } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import type { CalendarEvent } from "@/features/calendar/mock/mock-calendar";
import { getTodayDateString } from "@/features/calendar/services/calendar-events-store";
import { getAllFollowUps } from "@/features/followup/services/followup-store";
import { getAllMailVorgaenge } from "@/features/mail/unified-mail-source-service";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

const MS_PER_HOUR = 60 * 60 * 1000;

function isOpenVorgang(vorgang: Vorgang): boolean {
  return vorgang.status !== "erledigt";
}

function hoursSince(iso: string): number {
  const received = Date.parse(iso);
  if (Number.isNaN(received)) return 0;
  return (Date.now() - received) / MS_PER_HOUR;
}

function resolveNextFreeHour(existingTimes: string[]): string {
  const used = new Set(existingTimes.map((t) => t.slice(0, 2)));
  for (let hour = 8; hour <= 17; hour++) {
    if (!used.has(String(hour).padStart(2, "0"))) {
      return `${String(hour).padStart(2, "0")}:00`;
    }
  }
  return "09:00";
}

function buildHelpyTaskEvent(input: {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  vorgangId: string;
  date?: string;
}): CalendarEvent {
  return {
    id: input.id,
    time: input.time,
    title: input.title,
    subtitle: input.subtitle,
    type: "helpy_aufgabe",
    helpyHint: "HELPY Aufgabe — aus offenem Vorgang erstellt.",
    date: input.date ?? getTodayDateString(),
    vorgangId: input.vorgangId,
    sourcePlatform: undefined,
  };
}

/** Erzeugt automatische Kalender-Aufgaben aus offenen Vorgängen. */
export function buildHelpyTasksFromVorgaenge(
  existingEvents: CalendarEvent[] = []
): CalendarEvent[] {
  const today = getTodayDateString();
  const tasks: CalendarEvent[] = [];
  const seen = new Set<string>();
  const todayTimes = existingEvents
    .filter((e) => e.date === today && e.type !== "helpy_aufgabe")
    .map((e) => e.time);

  for (const vorgang of getAllMailVorgaenge()) {
    if (!isOpenVorgang(vorgang)) continue;

    const suggestion = getAppointmentSuggestion(vorgang.id);
    if (
      suggestion?.confirmationStatus === "customer_confirmed" ||
      suggestion?.confirmationStatus === "saved_to_calendar"
    ) {
      const key = `viewing-${vorgang.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        const slot = suggestion.slots[0];
        tasks.push(
          buildHelpyTaskEvent({
            id: `helpy-viewing-${vorgang.id}`,
            time: slot?.start?.slice(0, 5) ?? "10:00",
            title: `🏠 Besichtigung: ${vorgang.titel}`,
            subtitle: vorgang.kunde,
            vorgangId: vorgang.id,
            date: slot?.date ?? today,
          })
        );
      }
    }

    if (vorgang.prioritaet === "kritisch" || vorgang.prioritaet === "hoch") {
      const key = `urgent-${vorgang.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        tasks.push(
          buildHelpyTaskEvent({
            id: `helpy-urgent-${vorgang.id}`,
            time: "09:00",
            title: `🔴 Dringend: ${vorgang.titel}`,
            subtitle: vorgang.kunde,
            vorgangId: vorgang.id,
          })
        );
      }
    }

    const receivedAt = vorgang.receivedAt;
    if (receivedAt && hoursSince(receivedAt) > 24) {
      const key = `overdue-${vorgang.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        tasks.push(
          buildHelpyTaskEvent({
            id: `helpy-overdue-${vorgang.id}`,
            time: resolveNextFreeHour([...todayTimes, ...tasks.map((t) => t.time)]),
            title: `⚡ Antwort überfällig: ${vorgang.titel}`,
            subtitle: vorgang.kunde,
            vorgangId: vorgang.id,
          })
        );
      }
    }
  }

  for (const followUp of getAllFollowUps()) {
    if (followUp.status === "abgeschlossen") continue;
    if (followUp.status !== "erinnerung" && followUp.status !== "dringend") continue;

    const key = `followup-${followUp.vorgangId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    tasks.push(
      buildHelpyTaskEvent({
        id: `helpy-followup-${followUp.vorgangId}`,
        time: followUp.status === "dringend" ? "09:30" : "11:00",
        title: `📞 Follow-up: ${followUp.customerName}`,
        subtitle: followUp.vorgangTitel,
        vorgangId: followUp.vorgangId,
      })
    );
  }

  return tasks.sort((a, b) => a.time.localeCompare(b.time));
}

export type CalendarImportantItem = {
  id: string;
  label: string;
  vorgangId: string;
  href: string;
};

export function buildTodayImportantItems(): CalendarImportantItem[] {
  const tasks = buildHelpyTasksFromVorgaenge();
  const today = getTodayDateString();
  const todayTasks = tasks.filter((t) => t.date === today);

  return todayTasks.slice(0, 6).map((task) => ({
    id: task.id,
    label: task.title.replace(/^[⚡🔴🏠📞]\s*/, ""),
    vorgangId: task.vorgangId!,
    href: `/workspace/${task.vorgangId}`,
  }));
}
