"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp, Plus } from "lucide-react";
import { MobileBackHeader } from "@/components/mobile/mobile-back-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CustomerProfile } from "@/features/customers/components/customer-profile";
import { CreateCustomerModal } from "@/features/customers/components/create-customer-modal";
import { HelpyKundenPanel } from "@/features/customers/components/helpy-kunden-panel";
import { KundenPicker } from "@/features/customers/components/kunden-picker";
import { KundenToolbar } from "@/features/customers/components/kunden-toolbar";
import { fetchKundenCustomers } from "@/features/customers/services/kunden-client";
import {
  getDbKundenCustomers,
  mergeDbCustomersWithBase,
  prependDbKundeCustomer,
  setDbKundenCustomers,
  subscribeDbKunden,
} from "@/features/customers/services/kunden-store";
import {
  filterCustomers,
  getFilterCounts,
  mockCustomers,
  searchCustomers,
  type Customer,
  type CustomerFilter,
} from "@/features/customers/mock/mock-customers";
import { useLeadScores } from "@/features/lead-scoring/hooks/use-lead-scores";
import { sortCustomersByLeadScore } from "@/features/lead-scoring/services/lead-score-refresh";
import { useConfirmedKundenakten } from "@/features/kundenakte/hooks/use-kundenakte";
import { mergeCustomersWithConfirmedKundenakten } from "@/features/kundenakte/services/kundenakte-mapper";
import { normalizePhone } from "@/features/crm/services/crm-merge";
import { cn } from "@/lib/utils";

export function KundenPage() {
  const searchParams = useSearchParams();
  const selectParam = searchParams.get("select");
  const phoneParam = searchParams.get("phone");
  const confirmedKundenakten = useConfirmedKundenakten();
  const [dbRevision, setDbRevision] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => subscribeDbKunden(() => setDbRevision((tick) => tick + 1)), []);

  useEffect(() => {
    void fetchKundenCustomers().then(setDbKundenCustomers);
  }, []);

  const baseCustomers = useMemo(() => {
    const mergedKundenakten = mergeCustomersWithConfirmedKundenakten(
      mockCustomers,
      confirmedKundenakten
    );
    return mergeDbCustomersWithBase(mergedKundenakten, getDbKundenCustomers());
  }, [confirmedKundenakten, dbRevision]);

  const customers = useLeadScores(baseCustomers);

  const [activeFilter, setActiveFilter] = useState<CustomerFilter>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(customers[0]?.id ?? "");
  const [sortByScore, setSortByScore] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  useEffect(() => {
    if (selectParam && customers.some((customer) => customer.id === selectParam)) {
      setSelectedId(selectParam);
      return;
    }

    if (phoneParam) {
      const normalized = normalizePhone(phoneParam);
      const match = customers.find(
        (customer) => normalizePhone(customer.phone) === normalized
      );
      if (match) {
        setSelectedId(match.id);
      }
    }
  }, [customers, phoneParam, selectParam]);

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

  const handleCustomerCreated = useCallback((customer: Customer) => {
    prependDbKundeCustomer(customer);
    setSelectedId(customer.id);
    setSuccessMessage("Kunde erfolgreich angelegt");
    window.setTimeout(() => setSuccessMessage(null), 4000);
  }, []);

  return (
    <DashboardShell
      activeHref="/kunden"
      rightPanel={<HelpyKundenPanel customer={selectedCustomer} />}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0]/80 px-4 py-3">
          <div>
            <h1 className="text-[1.125rem] font-semibold text-[#0F172A]">Kunden</h1>
            <p className="text-[12px] text-[#64748B]">
              Stammkunden verwalten und neue Kontakte anlegen
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#6366F1] to-[#4F46E5] px-4 text-[12px] font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-opacity hover:opacity-95"
          >
            <Plus className="size-4" />
            Neuen Kunden anlegen
          </button>
        </div>

        {successMessage ? (
          <div className="mx-4 mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-800">
            {successMessage}
          </div>
        ) : null}

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
          onSelect={(id) => {
            setSelectedId(id);
            if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
              setMobileProfileOpen(true);
            }
          }}
        />
        <div className="hidden min-h-0 flex-1 overflow-hidden lg:block">
          <CustomerProfile customer={selectedCustomer} />
        </div>
      </div>

      {mobileProfileOpen && selectedCustomer ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-white lg:hidden">
          <MobileBackHeader
            title={selectedCustomer.company}
            subtitle={selectedCustomer.contactPerson}
            onBack={() => setMobileProfileOpen(false)}
          />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CustomerProfile customer={selectedCustomer} />
          </div>
        </div>
      ) : null}

      <CreateCustomerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCustomerCreated}
      />
    </DashboardShell>
  );
}
