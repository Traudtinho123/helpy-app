import {
  BESTANDSKUNDE_DAYS_AFTER_CLOSE,
  MARKTUPDATE_INTERVAL_MONTHS,
  WEITEREMPFEHLUNG_MONTHS_AFTER_CLOSE,
  type NurturingCampaignType,
  type NurturingSettings,
} from "@/features/nurturing/types/nurturing-types";

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function isEligibleBestandskunde(input: {
  status: string;
  nurturingAktiv: boolean;
  letzterDealAbschluss: string | null;
  now?: Date;
}): boolean {
  if (!input.nurturingAktiv) return false;
  if (input.status !== "bestandskunde") return false;
  if (!input.letzterDealAbschluss) return false;

  const closeDate = new Date(input.letzterDealAbschluss);
  if (Number.isNaN(closeDate.getTime())) return false;

  const now = input.now ?? new Date();
  return daysBetween(closeDate, now) >= BESTANDSKUNDE_DAYS_AFTER_CLOSE;
}

export function isCampaignEnabled(
  settings: NurturingSettings,
  type: NurturingCampaignType
): boolean {
  switch (type) {
    case "marktupdate":
      return settings.marktupdateEnabled;
    case "jahrestag":
      return settings.jahrestagEnabled;
    case "weiterempfehlung":
      return settings.weiterempfehlungEnabled;
  }
}

/**
 * Prüft, ob für den gegebenen Wochencheck eine Kampagne fällig ist.
 * Vorbereitung läuft montags; Fenster ±3 Tage um den Soll-Termin.
 */
export function isCampaignDue(input: {
  campaignType: NurturingCampaignType;
  letzterDealAbschluss: string;
  lastSentAt: string | null;
  now?: Date;
}): boolean {
  const closeDate = new Date(input.letzterDealAbschluss);
  if (Number.isNaN(closeDate.getTime())) return false;

  const now = input.now ?? new Date();
  const today = startOfDay(now);

  if (input.campaignType === "marktupdate") {
    const eligibleFrom = addMonths(closeDate, Math.ceil(BESTANDSKUNDE_DAYS_AFTER_CLOSE / 30));
    if (today < startOfDay(eligibleFrom)) return false;

    if (!input.lastSentAt) return true;
    const last = new Date(input.lastSentAt);
    if (Number.isNaN(last.getTime())) return true;
    return today >= startOfDay(addMonths(last, MARKTUPDATE_INTERVAL_MONTHS));
  }

  if (input.campaignType === "weiterempfehlung") {
    const due = startOfDay(
      addMonths(closeDate, WEITEREMPFEHLUNG_MONTHS_AFTER_CLOSE)
    );
    if (input.lastSentAt) return false;
    const diff = Math.abs(daysBetween(due, today));
    return diff <= 7 && today >= due;
  }

  // Jahrestag: nächster Jahrestag ±7 Tage, noch nicht in diesem Jahr gesendet
  let anniversary = startOfDay(addYears(closeDate, 1));
  while (anniversary < addYears(today, -1)) {
    anniversary = addYears(anniversary, 1);
  }
  // Find anniversary in current/next window
  while (daysBetween(anniversary, today) > 7) {
    anniversary = addYears(anniversary, 1);
  }
  if (input.lastSentAt) {
    const last = new Date(input.lastSentAt);
    if (
      !Number.isNaN(last.getTime()) &&
      last.getFullYear() === anniversary.getFullYear()
    ) {
      return false;
    }
  }
  const diff = Math.abs(daysBetween(anniversary, today));
  return diff <= 7 && today >= addDays(anniversary, -7);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function nextCampaignHint(input: {
  letzterDealAbschluss: string | null;
  lastMarktupdateAt: string | null;
  lastJahrestagAt: string | null;
  lastWeiterempfehlungAt: string | null;
  settings: NurturingSettings;
  now?: Date;
}): { type: NurturingCampaignType; label: string; dueAt: string } | null {
  if (!input.letzterDealAbschluss) return null;
  const closeDate = new Date(input.letzterDealAbschluss);
  if (Number.isNaN(closeDate.getTime())) return null;

  const now = input.now ?? new Date();
  const candidates: { type: NurturingCampaignType; due: Date }[] = [];

  if (input.settings.marktupdateEnabled) {
    const eligibleFrom = addMonths(
      closeDate,
      Math.ceil(BESTANDSKUNDE_DAYS_AFTER_CLOSE / 30)
    );
    const due = input.lastMarktupdateAt
      ? addMonths(new Date(input.lastMarktupdateAt), MARKTUPDATE_INTERVAL_MONTHS)
      : eligibleFrom;
    candidates.push({ type: "marktupdate", due });
  }

  if (input.settings.jahrestagEnabled) {
    let anniversary = addYears(closeDate, 1);
    while (anniversary < now) {
      anniversary = addYears(anniversary, 1);
    }
    if (
      !input.lastJahrestagAt ||
      new Date(input.lastJahrestagAt).getFullYear() !== anniversary.getFullYear()
    ) {
      candidates.push({ type: "jahrestag", due: anniversary });
    }
  }

  if (input.settings.weiterempfehlungEnabled && !input.lastWeiterempfehlungAt) {
    candidates.push({
      type: "weiterempfehlung",
      due: addMonths(closeDate, WEITEREMPFEHLUNG_MONTHS_AFTER_CLOSE),
    });
  }

  candidates.sort((a, b) => a.due.getTime() - b.due.getTime());
  const next = candidates[0];
  if (!next) return null;

  const labels: Record<NurturingCampaignType, string> = {
    marktupdate: "Marktupdate",
    jahrestag: "Jahrestag",
    weiterempfehlung: "Weiterempfehlung",
  };

  return {
    type: next.type,
    label: labels[next.type],
    dueAt: next.due.toISOString(),
  };
}

export function toDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isMonday(date: Date = new Date()): boolean {
  return date.getDay() === 1;
}
