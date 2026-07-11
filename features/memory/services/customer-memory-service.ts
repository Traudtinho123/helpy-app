import {
  buildCustomerIdFromEmail,
  getIntelligenceCustomerMemory,
  subscribeIntelligenceCustomerMemory,
  upsertIntelligenceCustomerMemory,
} from "@/features/intelligence/customer-memory/customer-memory-store";
import { updateCustomerMemory } from "@/features/intelligence/memory-engine/memory-engine";
import {
  updateCustomerMemoryFromAppointment,
  updateCustomerMemoryFromKundenakte,
} from "@/features/intelligence/memory-engine/memory-triggers";
import type { CustomerMemory } from "@/features/intelligence/types/intelligence-types";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import {
  MOCK_BACKGROUND_CUSTOMER_MEMORIES,
} from "@/features/memory/mock/memory-mock";
import type {
  BackgroundMemoryEntry,
  BackgroundMemoryHint,
  BackgroundMemoryWorkspaceContext,
  MemoryCategory,
} from "@/features/memory/types/memory-types";

const IRRELEVANT_PATTERNS =
  /newsletter|unsubscribe|abmelden|werbung|gratis|click here|keine antwort nötig|vielen dank für ihre nachricht/i;

function normalizeValue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildDedupeKey(
  entityId: string,
  memoryType: MemoryCategory,
  normalizedValue: string
): string {
  return `${entityId}::${memoryType}::${normalizedValue}`;
}

function salutation(name?: string | null): string {
  if (!name?.trim()) return "Dieser Kunde";
  return name.trim();
}

export function isRelevantMemoryText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 8) return false;
  if (IRRELEVANT_PATTERNS.test(trimmed)) return false;
  return true;
}

export function seedBackgroundCustomerMemories(): void {
  for (const memory of MOCK_BACKGROUND_CUSTOMER_MEMORIES) {
    const existing = getIntelligenceCustomerMemory(memory.customerId);
    if (!existing) {
      upsertIntelligenceCustomerMemory(memory);
    }
  }
}

export function ingestCustomerMemoryFromText(input: {
  email: string;
  text: string;
  vorgangId?: string;
  source: "email" | "termin" | "kundenakte" | "angebot";
}): BackgroundMemoryEntry[] {
  if (!input.email || input.email === "—" || !isRelevantMemoryText(input.text)) {
    return [];
  }

  seedBackgroundCustomerMemories();

  const result = updateCustomerMemory({
    customerId: buildCustomerIdFromEmail(input.email),
    source: input.source,
    text: input.text,
    vorgangId: input.vorgangId,
  });

  if (!result.updated) return [];

  return result.newFacts.map((fact, index) => ({
    id: `customer-${input.vorgangId ?? "global"}-${index}`,
    entityType: "customer" as const,
    entityId: buildCustomerIdFromEmail(input.email),
    memoryType: inferCategoryFromFact(fact),
    value: fact,
    normalizedValue: normalizeValue(fact),
    displayText: fact,
    source: input.source,
    createdAt: new Date().toISOString(),
  }));
}

export function ingestCustomerMemoryFromKundenakte(
  kundenakte: Kundenakte
): void {
  updateCustomerMemoryFromKundenakte(kundenakte);
}

export function ingestCustomerMemoryFromAppointment(input: {
  vorgangId: string;
  email: string;
  slotLabel: string;
  snippet?: string;
}): void {
  updateCustomerMemoryFromAppointment(input);
}

function inferCategoryFromFact(fact: string): MemoryCategory {
  const lower = fact.toLowerCase();
  if (lower.includes("budget")) return "budget";
  if (lower.includes("kontakt") || lower.includes("telefon") || lower.includes("e-mail")) {
    return "kontaktpraeferenz";
  }
  if (lower.includes("nachmittag") || lower.includes("termin")) return "terminpraeferenz";
  if (lower.includes("garage") || lower.includes("parkplatz")) return "objektwunsch";
  return "persoenliche-info";
}

export function buildCustomerBackgroundHints(
  memory: CustomerMemory | null,
  context: BackgroundMemoryWorkspaceContext
): BackgroundMemoryHint[] {
  if (!memory) return [];

  const hints: BackgroundMemoryHint[] = [];
  const name = salutation(context.customerName);

  for (const preference of memory.preferences) {
    if (/nachmittag/i.test(preference)) {
      hints.push({
        id: "customer-termin-nachmittag",
        rememberText: `${name} bevorzugt Termine am Nachmittag.`,
        tipText: "Deshalb empfehle ich Termine nach 14:00 Uhr.",
        relevance: context.hasAppointmentFlow ? 100 : 70,
      });
    }

    if (/garage|parkplatz|stellplatz/i.test(preference)) {
      hints.push({
        id: "customer-garage",
        rememberText: `${name} sucht ausdrücklich eine Wohnung mit Garage.`,
        tipText: "Ich würde die Parkplatzsituation direkt in der Antwort erwähnen.",
        relevance: context.hasReplyDraft ? 90 : 75,
      });
    }
  }

  if (memory.communicationStyle?.toLowerCase().includes("schnell")) {
    hints.push({
      id: "customer-schnell",
      rememberText: `${name} antwortet meist schnell.`,
      tipText: "Eine zeitnahe Rückmeldung hält den Kontakt warm.",
      relevance: 60,
    });
  }

  if (memory.preferredContact === "Telefon") {
    hints.push({
      id: "customer-telefon",
      rememberText: `${name} bevorzugt telefonischen Kontakt.`,
      tipText: "Ich empfehle einen kurzen Anruf statt einer langen E-Mail.",
      relevance: context.hasReplyDraft ? 85 : 65,
    });
  }

  if (memory.budget) {
    hints.push({
      id: "customer-budget",
      rememberText: `${name} hat ein Budget von ${memory.budget}.`,
      relevance: 55,
    });
  }

  for (const fact of memory.importantFacts) {
    hints.push({
      id: `customer-fact-${normalizeValue(fact)}`,
      rememberText: `${name}: ${fact}.`,
      relevance: 50,
    });
  }

  return hints;
}

export function getCustomerMemoryForEmail(email: string): CustomerMemory | null {
  if (!email || email === "—") return null;
  seedBackgroundCustomerMemories();
  return getIntelligenceCustomerMemory(buildCustomerIdFromEmail(email));
}

export { subscribeIntelligenceCustomerMemory as subscribeCustomerBackgroundMemory };
