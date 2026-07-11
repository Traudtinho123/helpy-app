"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDaysWithEvents, useCalendarStore } from "@/features/calendar/services/calendar-events-store";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

const TODAY = new Date(2026, 6, 6); // 6. Juli 2026
const MONTH_LABEL = "Juli 2026";

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mo = 0
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

type MonthCalendarProps = {
  selectedDay: number;
  onSelectDay: (day: number) => void;
};

export function MonthCalendar({ selectedDay, onSelectDay }: MonthCalendarProps) {
  useCalendarStore();
  const eventDays = getDaysWithEvents();
  const cells = getMonthGrid(TODAY.getFullYear(), TODAY.getMonth());

  return (
    <div className="rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[#0F172A]">
          {MONTH_LABEL}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="size-7 rounded-lg border-[#CBD5E1]/60"
            aria-label="Vorheriger Monat"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="size-7 rounded-lg border-[#CBD5E1]/60"
            aria-label="Nächster Monat"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-[10px] font-semibold text-[#94A3B8]"
          >
            {day}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const isToday = day === TODAY.getDate();
          const isSelected = day === selectedDay;
          const hasEvents = eventDays.includes(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-[10px] text-[12px] font-medium transition-all duration-200",
                isToday && !isSelected && "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/30",
                isSelected && !isToday && "bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#2563EB]/20",
                isSelected && isToday && "bg-[#2563EB] text-white ring-2 ring-[#93C5FD]",
                !isToday && !isSelected && "text-[#334155] hover:bg-[#F1F5F9]"
              )}
            >
              {day}
              {hasEvents && !isToday && (
                <span className="absolute bottom-1 size-1 rounded-full bg-[#2563EB]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
