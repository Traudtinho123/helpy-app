import { beforeEach, describe, expect, it } from "vitest";
import {
  cloneCompanyKnowledge,
  createEmptyCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-defaults";
import { saveCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-service";
import { getNextOpenDates } from "@/features/appointment-suggestions/services/viewing-date-parser";
import {
  buildAppointmentSchedulingPolicy,
  FALLBACK_APPOINTMENT_DURATIONS,
  resolveAppointmentDurationFromPolicy,
} from "@/features/calendar/services/appointment-scheduling-policy";
import { computeFreeSlots } from "@/features/calendar/services/availability-engine";
import {
  loadCompanyProfileById,
  updateLoadedCompanyProfile,
} from "@/lib/company/company-profile-service";
import { MOCK_COMPANY_PROFILE } from "@/lib/company/company-profile-types";

describe("appointment scheduling policy", () => {
  beforeEach(async () => {
    loadCompanyProfileById(MOCK_COMPANY_PROFILE.companyId);
    updateLoadedCompanyProfile({
      companySignature: "",
      companyName: "Traudt Immobilien GmbH",
    });
    await saveCompanyKnowledge(createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId), "Test");
  });

  it("uses viewing duration from company knowledge instead of hardcoded fallback", async () => {
    const knowledge = cloneCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId)
    );
    knowledge.appointmentDurationViewingMinutes = 45;
    await saveCompanyKnowledge(knowledge, "Test");

    const policy = buildAppointmentSchedulingPolicy();
    const duration = resolveAppointmentDurationFromPolicy(
      "Besichtigung Wohnung Bahnhofstrasse",
      policy
    );

    expect(duration.kind).toBe("wohnungsbesichtigung");
    expect(duration.minutes).toBe(45);
    expect(duration.label).toBe("45 Minuten");
  });

  it("falls back safely when duration is missing or invalid", async () => {
    const knowledge = cloneCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId)
    );
    knowledge.appointmentDurationConsultationMinutes = 0;
    await saveCompanyKnowledge(knowledge, "Test");

    const policy = buildAppointmentSchedulingPolicy();
    const duration = resolveAppointmentDurationFromPolicy("Erstgespräch", policy);

    expect(duration.minutes).toBe(
      FALLBACK_APPOINTMENT_DURATIONS.erstgespraech
    );
    expect(duration.minutes).toBeGreaterThan(0);
  });

  it("excludes closed days such as saturday from target dates", async () => {
    const knowledge = cloneCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId)
    );
    knowledge.businessHours.saturday.closed = true;
    await saveCompanyKnowledge(knowledge, "Test");

    const policy = buildAppointmentSchedulingPolicy();
    const dates = getNextOpenDates(10, policy.isDayOpen, "2026-07-09");

    for (const isoDate of dates) {
      const [year, month, day] = isoDate.split("-").map(Number);
      const weekday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
      expect(weekday).not.toBe(6);
    }
  });

  it("limits free slots to configured business hours", async () => {
    const knowledge = cloneCompanyKnowledge(
      createEmptyCompanyKnowledge(MOCK_COMPANY_PROFILE.companyId)
    );
    for (const day of [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ] as const) {
      knowledge.businessHours[day] = {
        closed: false,
        start: "08:00",
        end: "18:00",
      };
    }
    await saveCompanyKnowledge(knowledge, "Test");

    const policy = buildAppointmentSchedulingPolicy();
    const workingHours = policy.getWorkingHoursForDate("2026-07-13");

    expect(workingHours).toEqual({ start: "08:00", end: "18:00" });

    const slots = computeFreeSlots({
      date: "2026-07-13",
      existingEvents: [],
      durationMinutes: 45,
      bufferMinutes: policy.bufferMinutes,
      workingHours: workingHours!,
      maxSlots: 20,
    });

    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(slot.start >= "08:00").toBe(true);
      expect(slot.end <= "18:00").toBe(true);
    }
    expect(slots.every((slot) => slot.start < "18:00")).toBe(true);
  });

  it("applies buffer minutes between suggested slots", async () => {
    const policy = buildAppointmentSchedulingPolicy();
    const slots = computeFreeSlots({
      date: "2026-07-13",
      existingEvents: [{ start: "10:00", end: "11:00" }],
      durationMinutes: 30,
      bufferMinutes: 15,
      workingHours: { start: "08:00", end: "18:00" },
      maxSlots: 5,
    });

    const starts = slots.map((slot) => slot.start);
    expect(starts).not.toContain("10:00");
    expect(starts).not.toContain("10:15");
    expect(starts).not.toContain("10:30");
    expect(starts.some((start) => start >= "11:15")).toBe(true);
  });
});
