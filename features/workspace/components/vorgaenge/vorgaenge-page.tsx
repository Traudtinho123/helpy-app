"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HelpyReportCard } from "@/features/workspace/components/vorgaenge/helpy-report-card";
import { HelpyVorgaengePanel } from "@/features/workspace/components/vorgaenge/helpy-vorgaenge-panel";
import { VorgangCard } from "@/features/workspace/components/vorgaenge/vorgang-card";
import { getBrainV2Summary } from "@/features/brain/services/brain-v2";
import {
  initGmailVorgangStatuses,
  initStatusForVorgaenge,
} from "@/features/workspace/services/status";
import {
  filterVorgaenge,
  getBrainV2Vorgaenge,
} from "@/features/workspace/services/vorgaenge/mock-vorgaenge";
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { subscribeHelpyReportReads } from "@/features/workspace/services/vorgaenge/helpy-report-read-store";
import {
  buildVorgaengeCentralSummary,
  subscribeVorgaengeCounts,
} from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import {
  deduplicateVorgaenge,
  sortDeduplicatedVorgaenge,
} from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import {
  getAllMailVorgaenge,
  hasMailVorgaenge,
  subscribeAllMailVorgaenge,
} from "@/features/mail";
import { subscribeHiddenVorgaenge } from "@/features/workspace/services/vorgang-visibility-store";
import { isMailSyncLoading } from "@/features/mail/mail-sync-status";
import {
  loadOutlookVorgaenge,
} from "@/features/outlook/services/outlook-vorgaenge-store";
import { refreshOutlookConnectionStatus } from "@/features/outlook/services/outlook-auth-service";
import { ensureCompletedVorgaengeLoaded } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { loadGmailVorgaenge } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { resolveGmailSyncContext } from "@/features/mail/services/gmail-sync-context-client";
import { syncGmailViaOAuthApi } from "@/features/oauth/services/oauth-connections-client";
import { syncGmailVorgaengeFromOAuthAccounts } from "@/features/workspace/services/vorgaenge/gmail-oauth-sync";
import { VORGANG_FILTER_LABELS, type VorgangFilter } from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const filterOrder: VorgangFilter[] = [
  "alle",
  "neu",
  "in_bearbeitung",
  "wartend",
  "erledigt",
  "helpy_reports",
];

export function VorgaengePage() {
  const [activeFilter, setActiveFilter] = useState<VorgangFilter>("alle");
  const [mounted, setMounted] = useState(false);
  const [mailRevision, setMailRevision] = useState(0);
  const [mailReady, setMailReady] = useState(false);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [countsRevision, setCountsRevision] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => subscribeAllMailVorgaenge(() => setMailRevision((tick) => tick + 1)), []);

  useEffect(
    () => subscribeHiddenVorgaenge(() => setMailRevision((tick) => tick + 1)),
    []
  );

  useEffect(
    () => subscribeVorgaengeCounts(() => setCountsRevision((tick) => tick + 1)),
    []
  );

  useEffect(
    () => subscribeHelpyReportReads(() => setCountsRevision((tick) => tick + 1)),
    []
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setMailReady(true);
      return;
    }

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Persistente Erledigt-Zustände laden, bevor Vorgänge aus Mail erzeugt werden.
      await ensureCompletedVorgaengeLoaded(session?.user?.id ?? null);

      const token = session?.provider_token;
      if (token) {
        const gmailContext = await resolveGmailSyncContext(session.user?.email ?? null);
        await loadGmailVorgaenge(token, gmailContext);
      }

      try {
        const payload = await syncGmailViaOAuthApi();
        if (payload.accounts.length > 0) {
          await syncGmailVorgaengeFromOAuthAccounts(payload.accounts);
        }
      } catch {
        // OAuth-Sync optional — Initial-Load kann mit provider_token laufen.
      }

      const outlookStatus = await refreshOutlookConnectionStatus();
      if (outlookStatus.status === "connected") {
        await loadOutlookVorgaenge();
      }

      setMailReady(true);
    });
  }, []);

  const useMailSource = mounted && hasMailVorgaenge();

  const allVorgaenge = useMemo(() => {
    if (!mounted || !mailReady) {
      return getBrainV2Vorgaenge();
    }

    const mailItems = getAllMailVorgaenge();
    return mailItems.length > 0 ? mailItems : getBrainV2Vorgaenge();
  }, [mounted, mailReady, mailRevision, countsRevision]);

  useEffect(() => {
    if (!mounted || !mailReady) return;

    const mailItems = getAllMailVorgaenge();
    const items = mailItems.length > 0 ? mailItems : getBrainV2Vorgaenge();
    const customerItems = items.filter((item) => !isHelpyReportVorgang(item));
    if (customerItems.length === 0) return;

    if (mailItems.length > 0) {
      initGmailVorgangStatuses(customerItems);
    } else {
      initStatusForVorgaenge(customerItems);
    }
  }, [mounted, mailReady, mailRevision]);

  const brainSummary = useMemo(() => getBrainV2Summary(), []);

  const filterCounts = useMemo(
    () => buildVorgaengeCentralSummary(allVorgaenge).filterCounts,
    [allVorgaenge, countsRevision]
  );

  const filteredVorgaenge = useMemo(() => {
    const filtered = filterVorgaenge(allVorgaenge, activeFilter);
    const { vorgaenge } = deduplicateVorgaenge(filtered);
    if (activeFilter === "helpy_reports") {
      return vorgaenge;
    }
    return sortDeduplicatedVorgaenge(vorgaenge);
  }, [activeFilter, allVorgaenge]);

  const isLoading = mounted && (!mailReady || isMailSyncLoading());

  return (
    <DashboardShell
      activeHref="/vorgaenge"
      rightPanel={
        <HelpyVorgaengePanel
          allVorgaenge={allVorgaenge}
          summary={brainSummary}
          useMailSource={useMailSource}
          panelMessage={panelMessage}
        />
      }
    >
      <div className="mx-auto max-w-4xl px-8 py-12 lg:px-12 lg:py-14">
        <header className="mb-8">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
            Arbeit zentral
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.035em] text-[#0F172A] lg:text-[2.25rem]">
            Vorgänge
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#64748B]">
            Alle von HELPY erkannten Arbeiten — sortiert nach Tätigkeit, nicht
            nach Plattform. Bitte prüfen und bestätigen.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {filterOrder.map((filter) => {
            const isActive = activeFilter === filter;
            const count = filterCounts[filter];
            const unreadReports =
              filter === "helpy_reports" ? filterCounts.helpy_reports_unread : 0;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-300",
                  isActive
                    ? "border-[#2563EB]/30 bg-[#EFF6FF] text-[#2563EB] shadow-sm"
                    : "border-transparent bg-white/80 text-[#64748B] hover:border-[#CBD5E1]/60 hover:bg-white"
                )}
              >
                {filter === "helpy_reports" && (
                  <Bot
                    className="mr-1.5 inline size-3.5 -translate-y-px align-middle"
                    strokeWidth={2.25}
                  />
                )}
                {VORGANG_FILTER_LABELS[filter]}
                {mounted && filter === "helpy_reports" ? (
                  unreadReports > 0 ? (
                    <span className="ml-1.5 rounded-full bg-[#E2E8F0] px-1.5 py-0.5 text-[10px] tabular-nums font-medium text-[#64748B]">
                      {unreadReports}
                    </span>
                  ) : count > 0 ? (
                    <span className="ml-1.5 tabular-nums opacity-50">{count}</span>
                  ) : null
                ) : (
                  mounted && (
                    <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                  )
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-white/70 px-8 py-16 text-center backdrop-blur-xl">
              <p className="text-sm font-medium text-[#64748B]">
                HELPY lädt deine Vorgänge…
              </p>
            </div>
          ) : filteredVorgaenge.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-white/70 px-8 py-16 text-center backdrop-blur-xl">
              <p className="text-sm font-medium text-[#64748B]">
                Keine Vorgänge in diesem Filter.
              </p>
            </div>
          ) : (
            filteredVorgaenge.map((vorgang) =>
              isHelpyReportVorgang(vorgang) ? (
                <HelpyReportCard key={vorgang.id} vorgang={vorgang} />
              ) : (
                <VorgangCard
                  key={vorgang.id}
                  vorgang={vorgang}
                  onCompleted={(_message, helpyPanelMessage) => {
                    setPanelMessage(helpyPanelMessage);
                  }}
                />
              )
            )
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
