import type { ObjectMemoryRecord } from "@/features/memory/types/memory-types";
import type { CustomerMemory } from "@/features/intelligence/types/intelligence-types";
import { buildCustomerIdFromEmail } from "@/features/intelligence/customer-memory/customer-memory-store";

/** Demo-Kundenwissen für Hintergrund-Memory (kein UI). */
export const MOCK_BACKGROUND_CUSTOMER_MEMORIES: CustomerMemory[] = [
  {
    customerId: buildCustomerIdFromEmail("thomas.mueller@example.com"),
    memorySummary:
      "Bevorzugt Termine am Nachmittag · Antwortet meist schnell",
    preferences: ["Bevorzugt Termine am Nachmittag"],
    budget: null,
    communicationStyle: "Antwortet meist schnell",
    preferredContact: "E-Mail",
    importantFacts: [],
    lastUpdated: "2026-07-08T09:00:00+02:00",
  },
  {
    customerId: buildCustomerIdFromEmail("sandra.keller@example.com"),
    memorySummary: "Sucht ausdrücklich Wohnung mit Garage",
    preferences: ["Sucht Wohnung mit Garage/Parkplatz"],
    budget: null,
    communicationStyle: null,
    preferredContact: "E-Mail",
    importantFacts: [],
    lastUpdated: "2026-07-07T16:00:00+02:00",
  },
];

/** Demo-Objektwissen aus Portfolio-Kontext. */
export const MOCK_BACKGROUND_OBJECT_MEMORIES: Record<string, ObjectMemoryRecord> = {
  "obj-bahnhofstrasse-12-zuerich": {
    objectId: "obj-bahnhofstrasse-12-zuerich",
    frequentQuestions: ["Parkplatz / Garage", "Lift", "Nebenkosten"],
    desiredFeatures: ["Garage", "Balkon"],
    inquiryIntensity: "hoch",
    typicalViewingTimes: ["Freitagnachmittag", "Nachmittag"],
    commonObjections: [],
    importantDocuments: ["Exposé"],
    openPoints: [],
    insights: [
      "Viele Interessenten fragen bei diesem Objekt nach Parkplätzen.",
      "Das Exposé wurde häufig angefragt.",
      "Besichtigungen für dieses Objekt werden oft am Freitag gewünscht.",
    ],
    lastUpdated: "2026-07-08T10:00:00+02:00",
  },
};
