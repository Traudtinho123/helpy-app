"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeCrm } from "@/features/crm/services/crm-store";
import {
  customerRefFromCustomer,
  enrichCustomerWithLeadScore,
  refreshLeadScoresForCustomers,
} from "@/features/lead-scoring/services/lead-score-refresh";
import { subscribeLeadScores } from "@/features/lead-scoring/services/lead-score-store";
import { subscribeAllMailVorgaenge } from "@/features/mail/unified-mail-source-service";
import { subscribeIntelligenceCustomerMemory } from "@/features/intelligence/customer-memory/customer-memory-store";

type ScoredCustomerFields = {
  id: string;
  email: string;
  company?: string;
  contactPerson?: string;
  lastActivity?: string;
  leadScore?: number;
  leadScoreUpdatedAt?: string;
};

export function useLeadScores<T extends ScoredCustomerFields>(
  customers: T[]
): T[] {
  const [revision, setRevision] = useState(0);

  useEffect(
    () => subscribeLeadScores(() => setRevision((value) => value + 1)),
    []
  );
  useEffect(
    () => subscribeAllMailVorgaenge(() => setRevision((value) => value + 1)),
    []
  );
  useEffect(() => subscribeCrm(() => setRevision((value) => value + 1)), []);
  useEffect(
    () =>
      subscribeIntelligenceCustomerMemory(() =>
        setRevision((value) => value + 1)
      ),
    []
  );

  useEffect(() => {
    if (customers.length === 0) return;
    refreshLeadScoresForCustomers(customers.map(customerRefFromCustomer));
  }, [customers]);

  return useMemo(
    () => customers.map((customer) => enrichCustomerWithLeadScore(customer)),
    [customers, revision]
  );
}
