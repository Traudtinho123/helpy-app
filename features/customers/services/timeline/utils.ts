import { matchesTimelineFilter } from "@/features/customers/services/timeline/config";
import type {
  TimelineDateGroup,
  TimelineEntry,
  TimelineFilter,
} from "@/features/customers/services/timeline/types";

function parseEntryDate(entry: TimelineEntry): Date {
  return new Date(`${entry.date}T${entry.time || "12:00"}:00`);
}

export function sortTimelineEntries(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort(
    (a, b) => parseEntryDate(b).getTime() - parseEntryDate(a).getTime()
  );
}

export function filterTimelineEntries(
  entries: TimelineEntry[],
  filter: TimelineFilter
): TimelineEntry[] {
  if (filter === "alle") return entries;
  return entries.filter((entry) => matchesTimelineFilter(entry.type, filter));
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entryDay = new Date(date);
  entryDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (today.getTime() - entryDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";

  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function groupTimelineByDate(
  entries: TimelineEntry[]
): TimelineDateGroup[] {
  const sorted = sortTimelineEntries(entries);
  const groups: TimelineDateGroup[] = [];

  for (const entry of sorted) {
    const label = formatDateLabel(entry.date);
    const existing = groups.find((group) => group.label === label);

    if (existing) {
      existing.entries.push(entry);
    } else {
      groups.push({ label, entries: [entry] });
    }
  }

  return groups;
}

export function formatTimelineTime(time: string): string {
  return time.slice(0, 5);
}
