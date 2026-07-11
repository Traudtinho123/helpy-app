import type {
  VoiceBusinessHours,
  VoiceSettings,
} from "@/features/voice/types/voice-types";

export const DEFAULT_VOICE_BUSINESS_HOURS: VoiceBusinessHours[] = [
  { weekday: 1, start: "09:00", end: "17:00" },
  { weekday: 2, start: "09:00", end: "17:00" },
  { weekday: 3, start: "09:00", end: "17:00" },
  { weekday: 4, start: "09:00", end: "17:00" },
  { weekday: 5, start: "09:00", end: "17:00" },
];

const TIMEZONE = "Europe/Zurich";

function parseHm(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function getZurichParts(date: Date): { weekday: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekdayLabel = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  return {
    weekday: weekdayMap[weekdayLabel] ?? 1,
    minutes: parseHm(`${hour}:${minute}`),
  };
}

export function resolveBusinessHours(
  settings: Pick<VoiceSettings, "businessHours">
): VoiceBusinessHours[] {
  if (settings.businessHours?.length) {
    return settings.businessHours;
  }
  return DEFAULT_VOICE_BUSINESS_HOURS;
}

export function isWithinBusinessHours(
  settings: Pick<VoiceSettings, "businessHours">,
  now = new Date()
): boolean {
  const hours = resolveBusinessHours(settings);
  const { weekday, minutes } = getZurichParts(now);
  const today = hours.find((entry) => entry.weekday === weekday);
  if (!today) return false;

  const start = parseHm(today.start);
  const end = parseHm(today.end);
  return minutes >= start && minutes < end;
}

export function formatBusinessHoursSummary(
  hours: VoiceBusinessHours[] = DEFAULT_VOICE_BUSINESS_HOURS
): string {
  const labels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  return hours
    .map((entry) => `${labels[entry.weekday - 1] ?? "?"} ${entry.start}–${entry.end}`)
    .join(", ");
}
