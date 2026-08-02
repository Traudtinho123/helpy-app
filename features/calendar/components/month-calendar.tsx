"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getDaysWithEventsForMonth,
  isToday,
  useCalendarStore,
} from "@/features/calendar/services/calendar-events-store";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

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

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export type CalendarMonthView = {
  month: number;
  year: number;
};

type MonthCalendarProps = {
  viewMonth: CalendarMonthView;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onChangeMonth: (view: CalendarMonthView) => void;
};

export function MonthCalendar({
  viewMonth,
  selectedDay,
  onSelectDay,
  onChangeMonth,
}: MonthCalendarProps) {
  useCalendarStore();
  const eventDays = getDaysWithEventsForMonth(viewMonth.month, viewMonth.year);
  const cells = getMonthGrid(viewMonth.year, viewMonth.month);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewMonth.year, viewMonth.month + delta, 1);
    onChangeMonth({ month: next.getMonth(), year: next.getFullYear() });
  };

  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
          {MONTH_NAMES[viewMonth.month]} {viewMonth.year}
        </h3>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-7 rounded-lg border-[var(--border)]"
            aria-label="Vorheriger Monat"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-7 rounded-lg border-[var(--border)]"
            aria-label="Nächster Monat"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-[10px] font-semibold text-[var(--text-muted)]"
          >
            {day}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const isTodayCell = isToday(day, viewMonth.month, viewMonth.year);
          const isSelected = day === selectedDay;
          const hasEvents = eventDays.includes(day);

          return (
            <button
              key={`${viewMonth.year}-${viewMonth.month}-${day}`}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-[10px] text-[12px] font-medium transition-all duration-200",
                isTodayCell &&
                  !isSelected &&
                  "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/30",
                isSelected &&
                  !isTodayCell &&
                  "bg-[var(--accent-light)] text-[var(--accent)] ring-1 ring-[#2563EB]/20",
                isSelected &&
                  isTodayCell &&
                  "bg-[#2563EB] text-white ring-2 ring-[#93C5FD]",
                !isTodayCell &&
                  !isSelected &&
                  "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              )}
            >
              {day}
              {hasEvents && !isTodayCell && (
                <span className="absolute bottom-1 size-1 rounded-full bg-[#2563EB]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
