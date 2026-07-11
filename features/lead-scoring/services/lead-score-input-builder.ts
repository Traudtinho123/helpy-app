import { getAllCrmCustomers } from "@/features/crm/services/crm-store";
import { normalizeEmail } from "@/features/crm/services/crm-merge";
import { getIntelligenceCustomerMemory } from "@/features/intelligence/customer-memory/customer-memory-store";
import { buildCustomerIdFromEmail } from "@/features/intelligence/customer-memory/customer-memory-store";
import type {
  LeadScoreCustomerRef,
  LeadScoreInput,
} from "@/features/lead-scoring/types/lead-scoring-types";
import { getAllMailVorgaenge } from "@/features/mail/unified-mail-source-service";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

function extractSenderEmail(from?: string): string | null {
  if (!from) return null;
  return extractEmailAddress(from)?.toLowerCase() ?? null;
}

function parseTimestamp(value?: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function resolveLatestContact(
  email: string,
  vorgaenge: Vorgang[],
  crmLastContact?: string
): string | null {
  const timestamps = [
    parseTimestamp(crmLastContact),
    ...vorgaenge.map((v) =>
      Math.max(parseTimestamp(v.emailDate), parseTimestamp(v.receivedAt), parseTimestamp(v.latestMessageAt))
    ),
  ].filter((value) => value > 0);

  if (timestamps.length === 0) return crmLastContact ?? null;

  const latest = Math.max(...timestamps);
  return new Date(latest).toISOString();
}

function hasBudgetSignal(vorgaenge: Vorgang[], email: string): boolean {
  const memory = getIntelligenceCustomerMemory(buildCustomerIdFromEmail(email));
  if (memory?.budget) return true;

  return vorgaenge.some((vorgang) => {
    const haystack = [
      vorgang.summary ?? "",
      vorgang.snippet ?? "",
      ...(vorgang.detectedContext ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return (
      haystack.includes("budget") ||
      /\b\d[\d.'\s]{2,}\s*(?:chf|eur|€|fr\.?)\b/i.test(haystack)
    );
  });
}

function hasLocationSignal(vorgaenge: Vorgang[]): boolean {
  return vorgaenge.some((vorgang) => {
    const context = vorgang.detectedContext ?? [];
    return context.some((line) =>
      /^(adresse|objekt|standort|location|lage)\s*:/i.test(line.trim())
    );
  });
}

function hasRepliedToHelpy(vorgaenge: Vorgang[]): boolean {
  return vorgaenge.some((vorgang) => {
    if (vorgang.latestMessageDirection !== "incoming") return false;
    return vorgang.status === "neu" || vorgang.status === "in_bearbeitung";
  });
}

function hasViewingRequest(vorgaenge: Vorgang[]): boolean {
  return vorgaenge.some((vorgang) => {
    const label = (vorgang.intentLabel ?? vorgang.typ ?? "").toLowerCase();
    return (
      label.includes("besichtigung") ||
      label.includes("termin") ||
      vorgang.typ === "terminwunsch" ||
      vorgang.intent === "besichtigung"
    );
  });
}

function hasMultipleInquiriesSameObject(vorgaenge: Vorgang[]): boolean {
  const objectKeys = new Map<string, number>();

  for (const vorgang of vorgaenge) {
    const objectLine =
      vorgang.detectedContext?.find((line) =>
        /^(objekt|adresse)\s*:/i.test(line.trim())
      ) ?? vorgang.titel;

    const key = objectLine.trim().toLowerCase();
    if (!key) continue;
    objectKeys.set(key, (objectKeys.get(key) ?? 0) + 1);
  }

  return [...objectKeys.values()].some((count) => count >= 2);
}

function hasUnansweredInquiries(vorgaenge: Vorgang[]): boolean {
  return vorgaenge.some(
    (vorgang) =>
      vorgang.latestMessageDirection === "incoming" &&
      vorgang.status === "neu"
  );
}

function hasOnlyGenericQuestions(vorgaenge: Vorgang[]): boolean {
  if (vorgaenge.length === 0) return false;

  return vorgaenge.every((vorgang) => {
    const genericIntent =
      vorgang.typ === "normale_nachricht" ||
      vorgang.intent === "normale_nachricht" ||
      vorgang.intent === "unklar";
    const hasCriteria =
      hasLocationSignal([vorgang]) || hasBudgetSignal([vorgang], "");
    return genericIntent && !hasCriteria;
  });
}

function collectVorgaengeForEmail(email: string, allVorgaenge: Vorgang[]): Vorgang[] {
  const normalized = normalizeEmail(email);
  if (!normalized) return [];

  return allVorgaenge.filter((vorgang) => {
    const sender = extractSenderEmail(vorgang.from);
    return sender === normalized;
  });
}

export function buildLeadScoreInput(
  customer: LeadScoreCustomerRef,
  allVorgaenge: Vorgang[] = getAllMailVorgaenge()
): LeadScoreInput {
  const email = normalizeEmail(customer.email);
  const vorgaenge = email ? collectVorgaengeForEmail(email, allVorgaenge) : [];

  const crmCustomer = email
    ? getAllCrmCustomers().find(
        (entry) => normalizeEmail(entry.email) === email
      )
    : null;

  const crmLinkedVorgaenge =
    crmCustomer?.vorgangIds
      .map((id) => allVorgaenge.find((v) => v.id === id))
      .filter((v): v is Vorgang => Boolean(v)) ?? [];

  const mergedVorgaenge = [
    ...new Map(
      [...vorgaenge, ...crmLinkedVorgaenge].map((v) => [v.id, v])
    ).values(),
  ];

  const lastContactAt = resolveLatestContact(
    email ?? customer.id,
    mergedVorgaenge,
    crmCustomer?.lastContactAt ?? customer.lastActivity
  );

  const hasExplicitBudget = email ? hasBudgetSignal(mergedVorgaenge, email) : false;
  const hasLocationCriteria = hasLocationSignal(mergedVorgaenge);

  return {
    customerKey: customer.id,
    email,
    lastContactAt,
    vorgangCount: mergedVorgaenge.length,
    hasExplicitBudget,
    hasLocationCriteria,
    repliedToHelpy: hasRepliedToHelpy(mergedVorgaenge),
    hasViewingRequest: hasViewingRequest(mergedVorgaenge),
    multipleInquiriesSameObject: hasMultipleInquiriesSameObject(mergedVorgaenge),
    unansweredInquiries: hasUnansweredInquiries(mergedVorgaenge),
    onlyGenericQuestions:
      mergedVorgaenge.length > 0 && hasOnlyGenericQuestions(mergedVorgaenge),
  };
}

export function buildLeadScoreInputs(
  customers: LeadScoreCustomerRef[]
): LeadScoreInput[] {
  const allVorgaenge = getAllMailVorgaenge();
  return customers.map((customer) => buildLeadScoreInput(customer, allVorgaenge));
}
