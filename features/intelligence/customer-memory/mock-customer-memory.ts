import type { CustomerMemory } from "@/features/intelligence/types/intelligence-types";
import {
  buildCustomerIdFromEmail,
  upsertIntelligenceCustomerMemory,
} from "@/features/intelligence/customer-memory/customer-memory-store";

/** Demo-Seed — keine Migration, nur Mockdaten. */
export function seedMockCustomerMemories(): void {
  const samples: CustomerMemory[] = [
    {
      customerId: buildCustomerIdFromEmail("sandra.mueller@example.com"),
      memorySummary:
        "Budget: 900.000 CHF · Bevorzugter Kontakt: Telefon · Haustier vorhanden",
      preferences: ["Haustier vorhanden"],
      budget: "900.000 CHF",
      communicationStyle: "Bevorzugt telefonisch",
      preferredContact: "Telefon",
      importantFacts: [],
      lastUpdated: "2026-07-05T10:00:00+02:00",
    },
    {
      customerId: buildCustomerIdFromEmail("familie.weber@example.com"),
      memorySummary:
        "Umzug Oktober · Familie mit Kindern · Bevorzugter Kontakt: E-Mail",
      preferences: ["Familie mit Kindern"],
      budget: null,
      communicationStyle: "Bevorzugt E-Mail",
      preferredContact: "E-Mail",
      importantFacts: ["Umzug Oktober"],
      lastUpdated: "2026-07-04T14:30:00+02:00",
    },
    {
      customerId: buildCustomerIdFromEmail("familie.berger@example.com"),
      memorySummary:
        "Budget: 950.000 CHF · Attikawohnung Zürich · Bevorzugter Kontakt: E-Mail",
      preferences: ["Attikawohnung", "Zürich"],
      budget: "950.000 CHF",
      communicationStyle: "Bevorzugt E-Mail",
      preferredContact: "E-Mail",
      importantFacts: ["Besichtigung Bahnhofstrasse 14 gewünscht"],
      lastUpdated: "2026-07-06T11:00:00+02:00",
    },
  ];

  for (const memory of samples) {
    upsertIntelligenceCustomerMemory(memory);
  }
}
