import { resolveCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-context";
import type { WeekdayId } from "@/features/company-knowledge/types/company-knowledge-types";
import type {
  AppointmentDurationKind,
  WorkingHours,
} from "@/features/calendar/services/availability-engine";
import type { CompanyProfile } from "@/lib/company/company-profile-types";
import {
  getCompanyProfileSnapshot,
  getLoadedCompanyId,
} from "@/lib/company/company-profile-service";

/** Einzige Fallback-Werte, wenn im Firmenwissen nichts Gültiges gepflegt ist. */
export const FALLBACK_APPOINTMENT_DURATIONS: Record<
  AppointmentDurationKind,
  number
> = {
  wohnungsbesichtigung: 45,
  baustellenbesichtigung: 60,
  erstgespraech: 30,
};

export const FALLBACK_BUFFER_MINUTES = 15;

export const FALLBACK_WORKING_HOURS: WorkingHours = {
  start: "08:00",
  end: "18:00",
};

export type AppointmentSchedulingPolicy = {
  companyId: string;
  bufferMinutes: number;
  durationByKind: Record<
    AppointmentDurationKind,
    { minutes: number; label: string }
  >;
  isDayOpen: (isoDate: string) => boolean;
  getWorkingHoursForDate: (isoDate: string) => WorkingHours | null;
};

function safePositiveMinutes(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function formatDurationLabel(minutes: number): string {
  return `${minutes} Minuten`;
}

function isoDateToWeekdayId(isoDate: string): WeekdayId | null {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  const weekday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
  const map: WeekdayId[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return map[weekday] ?? null;
}

function detectAppointmentKind(haystack: string): AppointmentDurationKind {
  const text = haystack.toLowerCase();

  if (
    text.includes("baustelle") ||
    text.includes("construction") ||
    text.includes("baustellenbesichtigung") ||
    text.includes("vor-ort") ||
    text.includes("vor ort")
  ) {
    return "baustellenbesichtigung";
  }

  if (
    text.includes("besichtigung") ||
    text.includes("immobil") ||
    text.includes("wohnung")
  ) {
    return "wohnungsbesichtigung";
  }

  return "erstgespraech";
}

export function buildAppointmentSchedulingPolicy(
  profileOverride?: CompanyProfile
): AppointmentSchedulingPolicy {
  const loadedCompanyId = getLoadedCompanyId();
  const snapshot = profileOverride ?? getCompanyProfileSnapshot();
  const activeProfile =
    loadedCompanyId && loadedCompanyId !== snapshot.companyId
      ? { ...snapshot, companyId: loadedCompanyId }
      : snapshot;

  const resolved = resolveCompanyKnowledge(activeProfile);

  const viewingMinutes = safePositiveMinutes(
    resolved.appointmentDurationViewingMinutes,
    FALLBACK_APPOINTMENT_DURATIONS.wohnungsbesichtigung
  );
  const consultationMinutes = safePositiveMinutes(
    resolved.appointmentDurationConsultationMinutes,
    FALLBACK_APPOINTMENT_DURATIONS.erstgespraech
  );
  const onSiteMinutes = safePositiveMinutes(
    resolved.appointmentDurationOnSiteMinutes,
    FALLBACK_APPOINTMENT_DURATIONS.baustellenbesichtigung
  );
  const bufferMinutes = safePositiveMinutes(
    resolved.defaultBufferMinutes,
    FALLBACK_BUFFER_MINUTES
  );

  const durationByKind: AppointmentSchedulingPolicy["durationByKind"] = {
    wohnungsbesichtigung: {
      minutes: viewingMinutes,
      label: formatDurationLabel(viewingMinutes),
    },
    baustellenbesichtigung: {
      minutes: onSiteMinutes,
      label: formatDurationLabel(onSiteMinutes),
    },
    erstgespraech: {
      minutes: consultationMinutes,
      label: formatDurationLabel(consultationMinutes),
    },
  };

  return {
    companyId: activeProfile.companyId,
    bufferMinutes,
    durationByKind,
    isDayOpen(isoDate: string) {
      const weekdayId = isoDateToWeekdayId(isoDate);
      if (!weekdayId) return true;
      return !resolved.businessHours[weekdayId].closed;
    },
    getWorkingHoursForDate(isoDate: string) {
      const weekdayId = isoDateToWeekdayId(isoDate);
      if (!weekdayId) return { ...FALLBACK_WORKING_HOURS };

      const hours = resolved.businessHours[weekdayId];
      if (hours.closed) return null;

      const start = hours.start?.trim() || FALLBACK_WORKING_HOURS.start;
      const end = hours.end?.trim() || FALLBACK_WORKING_HOURS.end;
      if (start >= end) return null;

      return { start, end };
    },
  };
}

export function resolveAppointmentDurationFromPolicy(
  haystack: string,
  policy: AppointmentSchedulingPolicy = buildAppointmentSchedulingPolicy()
): {
  kind: AppointmentDurationKind;
  minutes: number;
  label: string;
} {
  const kind = detectAppointmentKind(haystack);
  const duration = policy.durationByKind[kind];
  return {
    kind,
    minutes: duration.minutes,
    label: duration.label,
  };
}
