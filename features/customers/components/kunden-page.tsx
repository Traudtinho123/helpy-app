"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CustomerProfile } from "@/features/customers/components/customer-profile";
import { HelpyKundenPanel } from "@/features/customers/components/helpy-kunden-panel";
import { KundenPicker } from "@/features/customers/components/kunden-picker";
import { KundenToolbar } from "@/features/customers/components/kunden-toolbar";
import {
  filterCustomers,
  getFilterCounts,
  mockCustomers,
  searchCustomers,
  type CustomerFilter,
} from "@/features/customers/mock/mock-customers";
import { useLeadScores } from "@/features/lead-scoring/hooks/use-lead-scores";
import { sortCustomersByLeadScore } from "@/features/lead-scoring/services/lead-score-refresh";
import { useConfirmedKundenakten } from "@/features/kundenakte/hooks/use-kundenakte";
import { mergeCustomersWithConfirmedKundenakten } from "@/features/kundenakte/services/kundenakte-mapper";
import { cn } from "@/lib/utils";

export function KundenPage() {
  const confirmedKundenakten = useConfirmedKundenakten();
  const baseCustomers = useMemo(
    () => mergeCustomersWithConfirmedKundenakten(mockCustomers, confirmedKundenakten),
    [confirmedKundenakten]
  );
  const customers = useLeadScores(baseCustomers);

  const [activeFilter, setActiveFilter] = useState<CustomerFilter>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(customers[0]?.id ?? "");
  const [sortByScore, setSortByScore] = useState(false);

  const filterCounts = useMemo(() => getFilterCounts(customers), [customers]);

  const filteredCustomers = useMemo(() => {
    const byFilter = filterCustomers(customers, activeFilter);
    const searched = searchCustomers(byFilter, searchQuery);
    return sortByScore ? sortCustomersByLeadScore(searched) : searched;
  }, [activeFilter, customers, searchQuery, sortByScore]);

  const selectedCustomer =
    customers.find((c) => c.id === selectedId) ??
    filteredCustomers[0] ??
    null;

  const handleFilterChange = (filter: CustomerFilter) => {
    setActiveFilter(filter);
    const next = searchCustomers(filterCustomers(customers, filter), searchQuery);
    if (next.length > 0 && !next.some((c) => c.id === selectedId)) {
      setSelectedId(next[0].id);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const next = searchCustomers(
      filterCustomers(customers, activeFilter),
      query
    );
    if (next.length > 0 && !next.some((c) => c.id === selectedId)) {
      setSelectedId(next[0].id);
    }
  };

  return (
    <DashboardShell
      activeHref="/kunden"
      rightPanel={<HelpyKundenPanel customer={selectedCustomer} />}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <KundenToolbar
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          filterCounts={filterCounts}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          trailing={
            <button
              type="button"
              onClick={() => setSortByScore((value) => !value)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-[10px] border px-2.5 text-[11px] font-medium transition-colors",
                sortByScore
                  ? "border-[#2563EB]/30 bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#CBD5E1]/60 bg-white/90 text-[#64748B] hover:bg-white"
              )}
            >
              <ArrowDownUp className="size-3.5" />
              Score
            </button>
          }
        />
        <KundenPicker
          customers={filteredCustomers}
          selectedId={selectedCustomer?.id ?? ""}
          onSelect={setSelectedId}
        />
        <div className="min-h-0 flex-1 overflow-hidden">
          <CustomerProfile customer={selectedCustomer} />
        </div>
      </div>
    </DashboardShell>
  );
}
