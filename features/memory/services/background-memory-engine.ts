import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import {
  buildCompanyBackgroundHints,
} from "@/features/memory/services/company-knowledge-background-hints";
import { subscribeCompanyKnowledgeStore } from "@/features/company-knowledge/services/company-knowledge-service";
import {
  buildCustomerBackgroundHints,
  getCustomerMemoryForEmail,
  ingestCustomerMemoryFromAppointment,
  ingestCustomerMemoryFromKundenakte,
  ingestCustomerMemoryFromText,
  subscribeCustomerBackgroundMemory,
} from "@/features/memory/services/customer-memory-service";
import {
  buildObjectBackgroundHints,
  ingestObjectMemoryFromText,
  subscribeObjectBackgroundMemory,
} from "@/features/memory/services/object-memory-service";
import type {
  BackgroundMemoryEvent,
  BackgroundMemoryHint,
  BackgroundMemoryWorkspaceContext,
} from "@/features/memory/types/memory-types";
import { invalidateBackgroundMemoryWorkspaceSnapshots } from "@/features/memory/services/background-memory-workspace";

const dedupeIndex = new Set<string>();

function normalizeValue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function rememberDedupe(
  entityId: string,
  memoryType: string,
  value: string
): boolean {
  const key = `${entityId}::${memoryType}::${normalizeValue(value)}`;
  if (dedupeIndex.has(key)) return false;
  dedupeIndex.add(key);
  return true;
}

function collectBundleText(bundle: GmailVorgangBundle): string {
  return [
    bundle.brain.summary,
    bundle.brain.intent,
    bundle.message.snippet,
    bundle.liste.summary,
    ...(bundle.liste.detectedContext ?? []),
    bundle.workspace.letzteEmail.zusammenfassung,
    bundle.workspace.letzteEmail.betreff,
  ]
    .filter(Boolean)
    .join("\n");
}

function extractEmailFromBundle(bundle: GmailVorgangBundle): string {
  const from =
    bundle.brain.from ||
    bundle.message.from ||
    bundle.liste.from ||
    bundle.workspace.kunde.email;
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();
  if (from.includes("@")) return from.trim();
  return bundle.workspace.kunde.email !== "—" ? bundle.workspace.kunde.email : "";
}

/** Zentraler Einstieg für Hintergrund-Memory bei Systemereignissen. */
export function processBackgroundMemoryEvent(event: BackgroundMemoryEvent): void {
  switch (event.type) {
    case "mail-analysiert": {
      const entries = ingestCustomerMemoryFromText({
        email: event.email,
        text: event.text,
        vorgangId: event.vorgangId,
        source: "email",
      });
      for (const entry of entries) {
        rememberDedupe(entry.entityId, entry.memoryType, entry.value);
      }
      if (event.objectId) {
        ingestObjectMemoryFromText({
          objectId: event.objectId,
          text: event.text,
          source: "mail",
        });
      }
      break;
    }
    case "antwort-gesendet": {
      if (event.text) {
        ingestCustomerMemoryFromText({
          email: event.email,
          text: event.text,
          vorgangId: event.vorgangId,
          source: "email",
        });
      }
      break;
    }
    case "termin-bestaetigt": {
      ingestCustomerMemoryFromAppointment({
        vorgangId: event.vorgangId,
        email: event.email,
        slotLabel: event.slotLabel,
        snippet: event.text,
      });
      if (event.objectId && event.text) {
        ingestObjectMemoryFromText({
          objectId: event.objectId,
          text: event.text,
          source: "termin",
        });
      }
      break;
    }
    case "dokument-erkannt": {
      if (event.email && event.text) {
        ingestCustomerMemoryFromText({
          email: event.email,
          text: event.text,
          vorgangId: event.vorgangId,
          source: "email",
        });
      }
      if (event.objectId) {
        ingestObjectMemoryFromText({
          objectId: event.objectId,
          text: event.text,
          source: "dokument",
        });
      }
      break;
    }
    case "kundenakte-bestaetigt": {
      ingestCustomerMemoryFromKundenakte(event.kundenakte);
      const text = [
        event.kundenakte.name,
        event.kundenakte.firma,
        event.kundenakte.betreff,
        event.kundenakte.zusammenfassung,
      ]
        .filter(Boolean)
        .join("\n");
      if (event.kundenakte.email) {
        ingestCustomerMemoryFromText({
          email: event.kundenakte.email,
          text,
          vorgangId: event.kundenakte.vorgangId,
          source: "kundenakte",
        });
      }
      break;
    }
    case "objekt-erkannt": {
      ingestObjectMemoryFromText({
        objectId: event.objectId,
        text: event.text,
        source: "objekt",
      });
      break;
    }
    case "vorgang-erledigt": {
      if (event.email && event.text) {
        ingestCustomerMemoryFromText({
          email: event.email,
          text: event.text,
          vorgangId: event.vorgangId,
          source: "email",
        });
      }
      break;
    }
  }

  invalidateBackgroundMemoryWorkspaceSnapshots();
}

export function processBackgroundMemoryFromGmailBundle(
  bundle: GmailVorgangBundle,
  objectId?: string | null
): void {
  const email = extractEmailFromBundle(bundle);
  const text = collectBundleText(bundle);
  if (!email || !text.trim()) return;

  processBackgroundMemoryEvent({
    type: "mail-analysiert",
    vorgangId: bundle.liste.id,
    email,
    text,
    objectId: objectId ?? null,
  });
}

export function getBackgroundMemoryWorkspaceHints(
  context: BackgroundMemoryWorkspaceContext
): BackgroundMemoryHint[] {
  const customerMemory = context.customerEmail
    ? getCustomerMemoryForEmail(context.customerEmail)
    : null;

  const hints = [
    ...buildCustomerBackgroundHints(customerMemory, context),
    ...buildObjectBackgroundHints(context.objectId, context),
    ...buildCompanyBackgroundHints(context),
  ];

  const unique = new Map<string, BackgroundMemoryHint>();
  for (const hint of hints) {
    const existing = unique.get(hint.id);
    if (!existing || hint.relevance > existing.relevance) {
      unique.set(hint.id, hint);
    }
  }

  return [...unique.values()]
    .sort((left, right) => right.relevance - left.relevance)
    .slice(0, 2);
}

export function subscribeBackgroundMemory(listener: () => void): () => void {
  const unsubCustomer = subscribeCustomerBackgroundMemory(listener);
  const unsubObject = subscribeObjectBackgroundMemory(listener);
  const unsubCompany = subscribeCompanyKnowledgeStore(() => {
    invalidateBackgroundMemoryWorkspaceSnapshots();
    listener();
  });
  return () => {
    unsubCustomer();
    unsubObject();
    unsubCompany();
  };
}
