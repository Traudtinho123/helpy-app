"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HelpyImmoScoutPanel } from "@/features/immoscout24/components/helpy-immoscout-panel";
import { InquiryDetail } from "@/features/immoscout24/components/inquiry-detail";
import { InquiryList } from "@/features/immoscout24/components/inquiry-list";
import {
  filterInquiries,
  getFilterCounts,
  mockInquiries,
  searchInquiries,
  type InquiryFilter,
} from "@/features/immoscout24/mock/mock-inquiries";

export function ImmoScout24Page() {
  const [activeFilter, setActiveFilter] = useState<InquiryFilter>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(mockInquiries[0]?.id ?? "");

  const filterCounts = useMemo(() => getFilterCounts(mockInquiries), []);

  const filteredInquiries = useMemo(() => {
    const byFilter = filterInquiries(mockInquiries, activeFilter);
    return searchInquiries(byFilter, searchQuery);
  }, [activeFilter, searchQuery]);

  const selectedInquiry =
    mockInquiries.find((i) => i.id === selectedId) ??
    filteredInquiries[0] ??
    null;

  const handleFilterChange = (filter: InquiryFilter) => {
    setActiveFilter(filter);
    const next = searchInquiries(
      filterInquiries(mockInquiries, filter),
      searchQuery
    );
    if (next.length > 0 && !next.some((i) => i.id === selectedId)) {
      setSelectedId(next[0].id);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const next = searchInquiries(
      filterInquiries(mockInquiries, activeFilter),
      query
    );
    if (next.length > 0 && !next.some((i) => i.id === selectedId)) {
      setSelectedId(next[0].id);
    }
  };

  return (
    <DashboardShell
      activeHref="/immoscout24"
      rightPanel={<HelpyImmoScoutPanel inquiry={selectedInquiry} />}
    >
      <div className="flex h-full min-h-0 overflow-hidden">
        <InquiryList
          inquiries={filteredInquiries}
          selectedId={selectedInquiry?.id ?? ""}
          onSelect={setSelectedId}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          filterCounts={filterCounts}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />
        <InquiryDetail inquiry={selectedInquiry} />
      </div>
    </DashboardShell>
  );
}
