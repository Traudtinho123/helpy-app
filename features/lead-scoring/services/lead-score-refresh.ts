import { calculateLeadScore } from "@/features/lead-scoring/services/lead-score-engine";
import {
  buildLeadScoreInput,
  buildLeadScoreInputs,
} from "@/features/lead-scoring/services/lead-score-input-builder";
import {
  areAnyLeadScoresStale,
  getLeadScoreRecord,
  upsertLeadScoreRecords,
} from "@/features/lead-scoring/services/lead-score-store";
import type {
  LeadScoreCustomerRef,
  LeadScoreRecord,
} from "@/features/lead-scoring/types/lead-scoring-types";
import { LEAD_SCORE_STALE_MS } from "@/features/lead-scoring/types/lead-scoring-types";

function toRecord(
  customer: LeadScoreCustomerRef,
  now: Date = new Date()
): LeadScoreRecord {
  const input = buildLeadScoreInput(customer);
  return {
    customerKey: customer.id,
    email: input.email,
    score: calculateLeadScore(input, now),
    updatedAt: now.toISOString(),
  };
}

export function refreshLeadScoresForCustomers(
  customers: LeadScoreCustomerRef[],
  options?: { force?: boolean; now?: Date }
): LeadScoreRecord[] {
  const now = options?.now ?? new Date();
  const force = options?.force ?? false;

  const targets = force
    ? customers
    : customers.filter((customer) =>
        areAnyLeadScoresStale([customer.id], LEAD_SCORE_STALE_MS)
      );

  if (targets.length === 0) {
    return customers
      .map((customer) => getLeadScoreRecord(customer.id))
      .filter((record): record is LeadScoreRecord => Boolean(record));
  }

  const records = targets.map((customer) => toRecord(customer, now));
  upsertLeadScoreRecords(records);

  void syncLeadScoresToServer(records).catch(() => {
    // Server-Sync optional — lokale Scores bleiben gültig.
  });

  return customers
    .map(
      (customer) =>
        getLeadScoreRecord(customer.id) ?? toRecord(customer, now)
    )
    .filter((record): record is LeadScoreRecord => Boolean(record));
}

export function computeLeadScoreRecords(
  customers: LeadScoreCustomerRef[],
  now: Date = new Date()
): LeadScoreRecord[] {
  const inputs = buildLeadScoreInputs(customers);
  return inputs.map((input, index) => ({
    customerKey: customers[index]?.id ?? input.customerKey,
    email: input.email,
    score: calculateLeadScore(input, now),
    updatedAt: now.toISOString(),
  }));
}

async function syncLeadScoresToServer(records: LeadScoreRecord[]): Promise<void> {
  if (typeof window === "undefined" || records.length === 0) return;

  await fetch("/api/lead-scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });
}

export function customerRefFromCustomer(customer: {
  id: string;
  email: string;
  company?: string;
  contactPerson?: string;
  lastActivity?: string;
}): LeadScoreCustomerRef {
  return {
    id: customer.id,
    email: customer.email,
    company: customer.company,
    contactPerson: customer.contactPerson,
    lastActivity: customer.lastActivity,
  };
}

export function enrichCustomerWithLeadScore<
  T extends { id: string; leadScore?: number; leadScoreUpdatedAt?: string },
>(customer: T): T {
  const record = getLeadScoreRecord(customer.id);
  if (!record) return customer;
  return {
    ...customer,
    leadScore: record.score,
    leadScoreUpdatedAt: record.updatedAt,
  };
}

export function sortCustomersByLeadScore<
  T extends { id: string; leadScore?: number },
>(customers: T[]): T[] {
  return [...customers].sort((a, b) => {
    const scoreA = a.leadScore ?? getLeadScoreRecord(a.id)?.score ?? 5;
    const scoreB = b.leadScore ?? getLeadScoreRecord(b.id)?.score ?? 5;
    return scoreB - scoreA;
  });
}

export function getTopHotLeadCustomers<
  T extends {
    id: string;
    email: string;
    company: string;
    contactPerson: string;
    leadScore?: number;
  },
>(customers: T[], limit = 3): Array<T & { vorgangId?: string }> {
  const sorted = sortCustomersByLeadScore(customers);
  return sorted.slice(0, limit).map((customer) => ({
    ...customer,
    leadScore: customer.leadScore ?? getLeadScoreRecord(customer.id)?.score ?? 5,
  }));
}
