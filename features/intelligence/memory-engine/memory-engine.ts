import {
  buildCustomerIdFromEmail,
  getIntelligenceCustomerMemory,
  subscribeIntelligenceCustomerMemory,
  upsertIntelligenceCustomerMemory,
} from "@/features/intelligence/customer-memory/customer-memory-store";
import { extractCustomerKnowledgeFromText } from "@/features/intelligence/knowledge-engine/knowledge-extractor";
import type {
  CustomerMemory,
  CustomerMemoryUpdateInput,
  CustomerMemoryUpdateResult,
  CustomerPreferredContact,
  IntelligencePanelView,
} from "@/features/intelligence/types/intelligence-types";
import { invalidateMemoryWorkspaceSnapshots } from "@/features/memory/services/memory-workspace-snapshot";

const MAX_PANEL_BULLETS = 5;

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildMemorySummary(memory: CustomerMemory): string {
  const parts: string[] = [];

  if (memory.budget) {
    parts.push(`Budget: ${memory.budget}`);
  }

  if (memory.preferredContact) {
    parts.push(`Bevorzugter Kontakt: ${memory.preferredContact}`);
  }

  if (memory.communicationStyle) {
    parts.push(memory.communicationStyle);
  }

  if (memory.preferences.length > 0) {
    parts.push(...memory.preferences);
  }

  if (memory.importantFacts.length > 0) {
    parts.push(...memory.importantFacts);
  }

  return parts.join(" · ");
}

function createEmptyCustomerMemory(customerId: string): CustomerMemory {
  return {
    customerId,
    memorySummary: "",
    preferences: [],
    budget: null,
    communicationStyle: null,
    preferredContact: null,
    importantFacts: [],
    lastUpdated: new Date().toISOString(),
  };
}

function mergePreferredContact(
  current: CustomerPreferredContact | null,
  next: CustomerPreferredContact | null
): CustomerPreferredContact | null {
  if (!next) return current;
  if (!current) return next;
  return next;
}

function hasNewStrings(current: string[], next: string[]): boolean {
  return next.some((item) => !current.includes(item));
}

/** Schreibt nur, wenn neue Informationen erkannt wurden. */
export function updateCustomerMemory(
  input: CustomerMemoryUpdateInput
): CustomerMemoryUpdateResult {
  const extracted = extractCustomerKnowledgeFromText(input.text);
  const existing =
    getIntelligenceCustomerMemory(input.customerId) ??
    createEmptyCustomerMemory(input.customerId);

  const mergedPreferences = uniqueStrings([
    ...existing.preferences,
    ...extracted.preferences,
  ]);
  const mergedFacts = uniqueStrings([
    ...existing.importantFacts,
    ...extracted.importantFacts,
  ]);

  const budgetChanged =
    extracted.budget !== null && extracted.budget !== existing.budget;
  const styleChanged =
    extracted.communicationStyle !== null &&
    extracted.communicationStyle !== existing.communicationStyle;
  const contactChanged =
    extracted.preferredContact !== null &&
    extracted.preferredContact !== existing.preferredContact;
  const preferencesChanged = hasNewStrings(
    existing.preferences,
    extracted.preferences
  );
  const factsChanged = hasNewStrings(
    existing.importantFacts,
    extracted.importantFacts
  );

  const updated =
    budgetChanged ||
    styleChanged ||
    contactChanged ||
    preferencesChanged ||
    factsChanged;

  if (!updated) {
    return {
      updated: false,
      memory: existing,
      newFacts: [],
    };
  }

  const memory: CustomerMemory = {
    ...existing,
    preferences: mergedPreferences,
    importantFacts: mergedFacts,
    budget: budgetChanged ? extracted.budget : existing.budget,
    communicationStyle: styleChanged
      ? extracted.communicationStyle
      : existing.communicationStyle,
    preferredContact: mergePreferredContact(
      existing.preferredContact,
      extracted.preferredContact
    ),
    lastUpdated: new Date().toISOString(),
  };

  memory.memorySummary = buildMemorySummary(memory);
  upsertIntelligenceCustomerMemory(memory);
  invalidateMemoryWorkspaceSnapshots();

  const newFacts = uniqueStrings([
    ...(budgetChanged && extracted.budget ? [`Budget: ${extracted.budget}`] : []),
    ...(contactChanged && extracted.preferredContact
      ? [`Kontakt: ${extracted.preferredContact}`]
      : []),
    ...extracted.preferences.filter(
      (item) => !existing.preferences.includes(item)
    ),
    ...extracted.importantFacts.filter(
      (item) => !existing.importantFacts.includes(item)
    ),
  ]);

  return {
    updated: true,
    memory,
    newFacts,
  };
}

export function getCustomerMemoryByEmail(email: string): CustomerMemory | null {
  if (!email || email === "—") return null;
  return getIntelligenceCustomerMemory(buildCustomerIdFromEmail(email));
}

export function buildIntelligencePanelBullets(
  memory: CustomerMemory | null
): string[] {
  if (!memory) return [];

  const bullets: string[] = [];

  if (memory.budget) {
    bullets.push("Budget erkannt");
  }

  if (memory.preferences.some((item) => /haustier|hund|katze/i.test(item))) {
    bullets.push("Haustier erkannt");
  }

  if (memory.preferredContact === "Telefon") {
    bullets.push("Telefon bevorzugt");
  } else if (memory.preferredContact === "E-Mail") {
    bullets.push("E-Mail bevorzugt");
  } else if (memory.preferredContact === "WhatsApp") {
    bullets.push("WhatsApp bevorzugt");
  }

  for (const fact of memory.importantFacts) {
    if (fact.toLowerCase().startsWith("umzug")) {
      bullets.push(fact);
    }
  }

  for (const preference of memory.preferences) {
    if (
      !/haustier|hund|katze/i.test(preference) &&
      !bullets.includes(preference)
    ) {
      bullets.push(preference);
    }
  }

  for (const fact of memory.importantFacts) {
    if (!fact.toLowerCase().startsWith("umzug") && !bullets.includes(fact)) {
      bullets.push(fact);
    }
  }

  return uniqueStrings(bullets).slice(0, MAX_PANEL_BULLETS);
}

export function getIntelligencePanelViewForEmail(
  email: string
): IntelligencePanelView {
  const memory = getCustomerMemoryByEmail(email);
  return {
    bullets: buildIntelligencePanelBullets(memory),
    memorySummary: memory?.memorySummary ?? null,
  };
}

export {
  buildCustomerIdFromEmail,
  subscribeIntelligenceCustomerMemory,
};
