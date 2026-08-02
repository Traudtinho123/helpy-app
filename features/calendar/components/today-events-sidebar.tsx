"use client";

import Link from "next/link";
import { eventTypeStyles } from "@/features/calendar/mock/mock-calendar";
import type { CalendarMonthView } from "@/features/calendar/components/month-calendar";
import {
  getEventsForDay,
  getSidebarLabel,
  getTodayDateString,
  useCalendarStore,
} from "@/features/calendar/services/calendar-events-store";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;

type TodayEventsSidebarProps = {
  selectedDate: string;
  viewMonth: CalendarMonthView;
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
};

export function TodayEventsSidebar({
  selectedDate,
  viewMonth,
  selectedEventId,
  onSelectEvent,
}: TodayEventsSidebarProps) {
  useCalendarStore();
  const events = getEventsForDay(selectedDate);
  const todayKey = getTodayDateString();
  const heading =
    selectedDate === todayKey
      ? "Heute"
      : `${parseInt(selectedDate.split("-")[2] ?? "0", 10)}. ${MONTH_NAMES[viewMonth.month]}`;

  return (
    <div className="mt-5">
      <h3 className="mb-3 px-1 text-[11px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase">
        {heading}
      </h3>
      {events.length === 0 ? (
        <p className="px-1 text-[12px] text-[var(--text-muted)]">Keine Termine</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const styles = eventTypeStyles[event.type];
            const isSelected = selectedEventId === event.id;

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectEvent(event.id)}
                className={cn(
                  "flex w-full gap-3 rounded-[16px] border p-3.5 text-left transition-all duration-300",
                  isSelected
                    ? "border-[var(--border-accent)] bg-[var(--bg-surface)] shadow-[0_2px_16px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]/15"
                    : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[#2563EB]/20 hover:shadow-sm",
                  event.type === "helpy_aufgabe" && "border-[#C7D2FE]/60 bg-[#EEF2FF]/20",
                  event.sourceEmailId && "helpy-fade-in"
                )}
              >
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <span className={cn("size-2 rounded-full", styles.dot)} />
                  <span className="text-[11px] font-semibold tabular-nums text-[var(--text-secondary)]">
                    {event.time}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  {event.type === "helpy_aufgabe" ? (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#4338CA]">
                      HELPY Aufgabe
                    </p>
                  ) : null}
                  {event.vorgangId ? (
                    <Link
                      href={`/workspace/${event.vorgangId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[12px] font-medium leading-snug text-[var(--text-primary)] hover:underline"
                    >
                      {getSidebarLabel(event)}
                    </Link>
                  ) : (
                    <p className="text-[12px] font-medium leading-snug text-[var(--text-primary)]">
                      {getSidebarLabel(event)}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
