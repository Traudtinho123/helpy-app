import { getAppointmentSuggestion } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { mockCalendarEvents } from "@/features/calendar/mock/mock-calendar";
import { getAllCalendarEvents } from "@/features/calendar/services/calendar-events-store";
import {
  CRM_PIPELINE_STAGE_LABELS,
} from "@/features/crm/pipeline/pipeline-types";
import { getAllCrmPipelineRecords } from "@/features/crm/pipeline/pipeline-store";
import { mockCustomers } from "@/features/customers/mock/mock-customers";
import { getAllDocuments } from "@/features/documents/services/document-engine";
import { getAllIntelligenceCustomerMemories } from "@/features/intelligence/customer-memory/customer-memory-store";
import { getAllKundenakten } from "@/features/kundenakte/services/kundenakte-store";
import { mockOffers } from "@/features/offers/mock/mock-offers";
import { getAllRealEstateObjects } from "@/features/real-estate/object/object-memory";
import { GLOBAL_SEARCH_MOCK_ENTRIES } from "@/features/search/services/global-search-mock-entries";
import type { GlobalSearchEntry } from "@/features/search/types/global-search-types";
import { getBrainV2Vorgaenge } from "@/features/workspace/services/vorgaenge/mock-vorgaenge";
import { getAllMailVorgaenge } from "@/features/mail";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { getWorkspacePath } from "@/features/workspace/services/workspace";

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchText(parts: Array<string | null | undefined>): string {
  return normalizeSearchText(parts.filter(Boolean).join(" "));
}

function pushUnique(
  entries: GlobalSearchEntry[],
  seen: Set<string>,
  entry: GlobalSearchEntry
): void {
  const key = `${entry.category}:${entry.id}`;
  if (seen.has(key)) return;
  seen.add(key);
  entries.push(entry);
}

function indexCustomers(entries: GlobalSearchEntry[], seen: Set<string>): void {
  for (const customer of mockCustomers) {
    pushUnique(entries, seen, {
      id: `customer-${customer.id}`,
      category: "kunde",
      title: customer.contactPerson,
      subtitle: customer.company,
      href: "/kunden",
      searchText: buildSearchText([
        customer.contactPerson,
        customer.company,
        customer.email,
        customer.phone,
        customer.address,
        ...customer.tags,
        customer.notes,
      ]),
    });
  }

  for (const kundenakte of getAllKundenakten()) {
    pushUnique(entries, seen, {
      id: `kundenakte-${kundenakte.vorgangId}`,
      category: "kunde",
      title: kundenakte.name,
      subtitle: kundenakte.firma || kundenakte.email,
      href: `/kunden/akte/${encodeURIComponent(kundenakte.vorgangId)}`,
      searchText: buildSearchText([
        kundenakte.name,
        kundenakte.firma,
        kundenakte.email,
        kundenakte.telefon,
        kundenakte.adresse,
        kundenakte.betreff,
        kundenakte.zusammenfassung,
      ]),
    });
  }
}

function indexObjects(entries: GlobalSearchEntry[], seen: Set<string>): void {
  for (const object of getAllRealEstateObjects()) {
    pushUnique(entries, seen, {
      id: `object-${object.objectId}`,
      category: "objekt",
      title: object.titel,
      subtitle: [object.adresse, object.plz, object.ort].filter(Boolean).join(", "),
      href: `/objekte/${encodeURIComponent(object.objectId)}`,
      searchText: buildSearchText([
        object.titel,
        object.adresse,
        object.plz,
        object.ort,
        object.land,
        object.preis,
        object.quelle,
        object.beschreibung,
        ...object.interessentLinks.map((link) => link.name),
        ...object.interessentLinks.map((link) => link.email),
      ]),
    });
  }
}

function indexGmailVorgang(
  entries: GlobalSearchEntry[],
  seen: Set<string>,
  vorgang: Vorgang
): void {
  pushUnique(entries, seen, {
    id: `gmail-${vorgang.id}`,
    category: "gmail",
    title: vorgang.titel,
    subtitle: vorgang.kunde,
    href: getWorkspacePath(vorgang.id),
      searchText: buildSearchText([
        vorgang.titel,
        vorgang.kunde,
        vorgang.summary,
        vorgang.snippet,
        vorgang.helpyEmpfehlung,
        vorgang.quelle,
        ...(vorgang.detectedContext ?? []),
      ]),
  });
}

function indexGmail(entries: GlobalSearchEntry[], seen: Set<string>): void {
  const vorgangIds = new Set<string>();

  for (const vorgang of getAllMailVorgaenge()) {
    vorgangIds.add(vorgang.id);
    indexGmailVorgang(entries, seen, vorgang);
  }

  for (const vorgang of getBrainV2Vorgaenge()) {
    if (vorgangIds.has(vorgang.id)) continue;
    indexGmailVorgang(entries, seen, vorgang);
  }
}

function indexDocuments(entries: GlobalSearchEntry[], seen: Set<string>): void {
  for (const document of getAllDocuments()) {
    const category = document.typeId === "offerte" ? "offerte" : "dokument";

    pushUnique(entries, seen, {
      id: `doc-${document.id}`,
      category,
      title: document.title,
      subtitle: `${document.typeLabel} · ${document.customer}`,
      href: document.vorgangId
        ? `/dokumente?vorgang=${encodeURIComponent(document.vorgangId)}&focus=${
            document.typeId === "offerte" ? "offerte" : "dokument"
          }`
        : "/dokumente",
      searchText: buildSearchText([
        document.title,
        document.customer,
        document.typeLabel,
        document.vorgangTitle,
        document.helpyHint,
        ...document.previewSections.map((section) => section.content),
        ...document.previewSections.map((section) => section.heading),
      ]),
    });
  }
}

function indexBesichtigungen(
  entries: GlobalSearchEntry[],
  seen: Set<string>,
  vorgangIds: string[]
): void {
  for (const vorgangId of vorgangIds) {
    const suggestion = getAppointmentSuggestion(vorgangId);
    if (!suggestion) continue;

    pushUnique(entries, seen, {
      id: `besichtigung-${vorgangId}`,
      category: "besichtigung",
      title: suggestion.title,
      subtitle: suggestion.objekt || suggestion.customer,
      href: `/kalender?vorgang=${encodeURIComponent(vorgangId)}&focus=besichtigung`,
      searchText: buildSearchText([
        suggestion.title,
        suggestion.customer,
        suggestion.objekt,
        suggestion.location,
        suggestion.date,
        suggestion.durationLabel,
        suggestion.sourceQuelle,
        suggestion.contactEmail,
        ...suggestion.slots.map((slot) => slot.label),
        suggestion.viewingConfirmation?.dateLabel,
      ]),
    });
  }
}

function indexOffers(entries: GlobalSearchEntry[], seen: Set<string>): void {
  for (const offer of mockOffers) {
    pushUnique(entries, seen, {
      id: `offer-${offer.id}`,
      category: "offerte",
      title: offer.title,
      subtitle: `${offer.number} · ${offer.customer.company}`,
      href: "/angebote",
      searchText: buildSearchText([
        offer.title,
        offer.number,
        offer.customer.company,
        offer.customer.contact,
        offer.customer.email,
        offer.customer.address,
        ...offer.lineItems.map((item) => item.description),
      ]),
    });
  }
}

function indexCalendar(entries: GlobalSearchEntry[], seen: Set<string>): void {
  const events =
    typeof window !== "undefined" ? getAllCalendarEvents() : mockCalendarEvents;

  for (const event of events) {
    pushUnique(entries, seen, {
      id: `calendar-${event.id}`,
      category: "kalender",
      title: event.title,
      subtitle: event.subtitle ?? event.location ?? event.date,
      href: event.vorgangId
        ? `/kalender?vorgang=${encodeURIComponent(event.vorgangId)}&focus=besichtigung`
        : "/kalender",
      searchText: buildSearchText([
        event.title,
        event.subtitle,
        event.location,
        event.date,
        event.time,
        event.helpyHint,
        ...(event.participants ?? []),
      ]),
    });
  }
}

function indexPipeline(entries: GlobalSearchEntry[], seen: Set<string>): void {
  for (const record of getAllCrmPipelineRecords()) {
    const vorgang =
      getAllMailVorgaenge().find((item) => item.id === record.vorgangId) ??
      getBrainV2Vorgaenge().find((item) => item.id === record.vorgangId);

    pushUnique(entries, seen, {
      id: `pipeline-${record.vorgangId}`,
      category: "pipeline",
      title: vorgang?.kunde ?? record.vorgangId,
      subtitle: CRM_PIPELINE_STAGE_LABELS[record.currentStage],
      href: vorgang ? getWorkspacePath(vorgang.id) : "/vorgaenge",
      searchText: buildSearchText([
        vorgang?.kunde,
        vorgang?.titel,
        vorgang?.summary,
        vorgang?.snippet,
        CRM_PIPELINE_STAGE_LABELS[record.currentStage],
        CRM_PIPELINE_STAGE_LABELS[record.recommendedStage],
        record.recommendationText,
      ]),
    });
  }
}

function indexMemory(entries: GlobalSearchEntry[], seen: Set<string>): void {
  for (const memory of getAllIntelligenceCustomerMemories()) {
    pushUnique(entries, seen, {
      id: `memory-${memory.customerId}`,
      category: "memory",
      title: memory.budget ? `Budget: ${memory.budget}` : "Kundenwissen",
      subtitle: memory.memorySummary || memory.communicationStyle || "HELPY Memory",
      href: "/kunden",
      searchText: buildSearchText([
        memory.budget,
        memory.communicationStyle,
        memory.memorySummary,
        memory.preferredContact,
        ...memory.preferences,
        ...memory.importantFacts,
        memory.customerId.replace(/^customer-/, "").replace(/@/g, " "),
      ]),
    });
  }
}

export function buildGlobalSearchIndex(): GlobalSearchEntry[] {
  const entries: GlobalSearchEntry[] = [];
  const seen = new Set<string>();

  indexCustomers(entries, seen);
  indexObjects(entries, seen);
  indexGmail(entries, seen);
  indexDocuments(entries, seen);
  indexOffers(entries, seen);
  indexCalendar(entries, seen);
  indexPipeline(entries, seen);
  indexMemory(entries, seen);

  const vorgangIds = [
    ...new Set([
      ...getAllMailVorgaenge().map((vorgang) => vorgang.id),
      ...getBrainV2Vorgaenge().map((vorgang) => vorgang.id),
      ...getAllKundenakten().map((kundenakte) => kundenakte.vorgangId),
    ]),
  ];
  indexBesichtigungen(entries, seen, vorgangIds);

  for (const entry of GLOBAL_SEARCH_MOCK_ENTRIES) {
    pushUnique(entries, seen, entry);
  }

  return entries;
}

export { normalizeSearchText };
