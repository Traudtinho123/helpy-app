"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmailAnalysisPanel } from "@/features/gmail/components/email-analysis-panel";
import { EmailList } from "@/features/gmail/components/email-list";
import { InboxSidebar } from "@/features/gmail/components/inbox-sidebar";
import {
  filterByChip,
  filterEmails,
  getChipCounts,
  getFilterCounts,
  mockEmails,
  type ChipFilter,
  type InboxFilter,
} from "@/features/gmail/mock/mock-emails";

export function InboxPage() {
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("heute");
  const [activeChip, setActiveChip] = useState<ChipFilter>("alle");

  const sidebarCounts = useMemo(() => getFilterCounts(mockEmails), []);
  const chipCounts = useMemo(() => getChipCounts(mockEmails), []);

  const filteredEmails = useMemo(() => {
    const bySidebar = filterEmails(mockEmails, activeFilter);
    return filterByChip(bySidebar, activeChip);
  }, [activeFilter, activeChip]);

  const [selectedId, setSelectedId] = useState(mockEmails[0]?.id ?? "");

  const selectedEmail =
    mockEmails.find((e) => e.id === selectedId) ??
    filteredEmails[0] ??
    null;

  const handleFilterChange = (filter: InboxFilter) => {
    setActiveFilter(filter);
    const bySidebar = filterEmails(mockEmails, filter);
    const next = filterByChip(bySidebar, activeChip);
    if (next.length > 0 && !next.some((e) => e.id === selectedId)) {
      setSelectedId(next[0].id);
    }
  };

  const handleChipChange = (chip: ChipFilter) => {
    setActiveChip(chip);
    const bySidebar = filterEmails(mockEmails, activeFilter);
    const next = filterByChip(bySidebar, chip);
    if (next.length > 0 && !next.some((e) => e.id === selectedId)) {
      setSelectedId(next[0].id);
    }
  };

  const handleSelectEmail = (id: string) => {
    setSelectedId(id);
  };

  return (
    <DashboardShell
      activeHref="/posteingang"
      rightPanel={<EmailAnalysisPanel email={selectedEmail} />}
    >
      <div className="flex h-full min-h-0 overflow-hidden">
        <InboxSidebar
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          counts={sidebarCounts}
        />
        <EmailList
          emails={filteredEmails}
          selectedId={selectedEmail?.id ?? ""}
          onSelect={handleSelectEmail}
          activeChip={activeChip}
          onChipChange={handleChipChange}
          chipCounts={chipCounts}
        />
      </div>
    </DashboardShell>
  );
}
