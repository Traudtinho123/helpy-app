import { describe, expect, it } from "vitest";
import {
  buildVoiceAppointmentAssistantReply,
  isVoiceAppointmentIntent,
  pickVoiceAppointmentSlot,
} from "@/features/voice/services/voice-appointment-engine";
import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";

const slots: AppointmentSlot[] = [
  {
    id: "slot-a",
    date: "2026-07-10",
    dateLabel: "Fr., 10.07.",
    start: "10:00",
    end: "11:00",
    label: "Fr., 10.07. · 10:00–11:00",
    durationMinutes: 60,
    calendarLabel: "Google Kalender",
  },
  {
    id: "slot-b",
    date: "2026-07-10",
    dateLabel: "Fr., 10.07.",
    start: "14:00",
    end: "15:00",
    label: "Fr., 10.07. · 14:00–15:00",
    durationMinutes: 60,
    calendarLabel: "Google Kalender",
  },
];

describe("voice-appointment-engine", () => {
  it("erkennt Termin-Intents", () => {
    expect(isVoiceAppointmentIntent("besichtigung")).toBe(true);
    expect(isVoiceAppointmentIntent("rueckruf")).toBe(false);
  });

  it("baut Antwort mit Slot-Vorschlägen", () => {
    const reply = buildVoiceAppointmentAssistantReply({
      intent: "besichtigung",
      callerName: "Anna",
      suggestion: {
        id: "s1",
        vorgangId: "v1",
        customer: "Anna",
        title: "Wohnung",
        objekt: "Wohnung",
        date: "2026-07-10",
        location: null,
        durationMinutes: 60,
        durationLabel: "60 Min.",
        appointmentKind: "besichtigung",
        calendarPlatform: "google",
        calendarLabel: "Google Kalender",
        slots,
        selectedSlotId: "slot-a",
        status: "vorbereitet",
        errorMessage: null,
        confirmedEventId: null,
        viewingConfirmation: null,
        confirmationStatus: "none",
        sourceQuelle: "Telefon",
        contactEmail: null,
        contactPhone: "+41 79 000 00 00",
        objectId: null,
      },
    });

    expect(reply).toContain("Anna");
    expect(reply).toContain("10:00–11:00");
  });

  it("wählt Slot passend zu Uhrzeit im Transkript", () => {
    const picked = pickVoiceAppointmentSlot(
      slots,
      "Können wir morgen um 14 Uhr einen Termin vereinbaren?"
    );
    expect(picked?.start).toBe("14:00");
  });
});
