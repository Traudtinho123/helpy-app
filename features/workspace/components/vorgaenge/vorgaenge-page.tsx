"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Phone, Plus, Sparkles } from "lucide-react";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useTerminology } from "@/hooks/useTerminology";
import { Button } from "@/components/ui/button";
import { CreateVorgangModal } from "@/features/vorgaenge/components/create-vorgang-modal";
import { loadDbVorgaengeFromApi } from "@/features/vorgaenge/services/db-vorgaenge-store";
import { getDbKundenCustomers, setDbKundenCustomers } from "@/features/customers/services/kunden-store";
import { MobileBackHeader } from "@/components/mobile/mobile-back-header";
import { HelpyReportCard } from "@/features/workspace/components/vorgaenge/helpy-report-card";
import { HelpyVorgaengePanel } from "@/features/workspace/components/vorgaenge/helpy-vorgaenge-panel";
import { VorgangCard } from "@/features/workspace/components/vorgaenge/vorgang-card";
import { VorgaengeBulkBar } from "@/features/workspace/components/vorgaenge/vorgaenge-bulk-bar";
import {
  ShortcutsHelpModal,
  VorgaengeKeyboardShortcuts,
} from "@/features/workspace/components/vorgaenge/vorgaenge-keyboard-shortcuts";
import { VorgangSplitDetail } from "@/features/workspace/components/vorgaenge/vorgang-split-detail";
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
import { loadOutlookVorgaenge } from "@/features/outlook/services/outlook-vorgaenge-store";
import { refreshOutlookConnectionStatus } from "@/features/outlook/services/outlook-auth-service";
import { ensureCompletedVorgaengeLoaded } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { loadGmailVorgaenge } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { resolveGmailSyncContext } from "@/features/mail/services/gmail-sync-context-client";
import { syncGmailViaOAuthApi } from "@/features/oauth/services/oauth-connections-client";
import { syncGmailVorgaengeFromOAuthAccounts } from "@/features/workspace/services/vorgaenge/gmail-oauth-sync";
import {
  applyPriorityOverride,
  subscribePriorityOverrides,
} from "@/features/workspace/services/vorgaenge/vorgaenge-priority-override-store";
import {
  filterHeuteZuErledigen,
  type VorgaengeQuickFilter,
} from "@/features/workspace/services/vorgaenge/vorgaenge-smart-filter";
import {
  filterNotSnoozed,
  subscribeSnoozedVorgaenge,
} from "@/features/workspace/services/vorgaenge/vorgaenge-snooze-store";
import {
  completeVorgang,
} from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import { getEffectiveVorgangStatus } from "@/features/workspace/services/vorgaenge/vorgang-effective-status";
import { getSkillVorgangFilterLabels, type VorgangFilter } from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const filterOrder: VorgangFilter[] = [
  "alle",
  "neu",
  "termine_anfragen",
  "in_bearbeitung",
  "wartend",
  "erledigt",
  "helpy_reports",
  "helpy_phone",
];

type ActivePanel = "none" | "reply" | "appointment";

export function VorgaengePage() {
  const { vorgaenge: vorgaengeLabel, skill } = useTerminology();
  const filterLabels = useMemo(
    () => getSkillVorgangFilterLabels(skill),
    [skill]
  );
  const [activeFilter, setActiveFilter] = useState<VorgangFilter>("alle");
  const [quickFilter, setQuickFilter] = useState<VorgaengeQuickFilter>("none");
  const [mounted, setMounted] = useState(false);
  const [mailRevision, setMailRevision] = useState(0);
  const [mailReady, setMailReady] = useState(false);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [countsRevision, setCountsRevision] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customersRevision, setCustomersRevision] = useState(0);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [cardPanelById, setCardPanelById] = useState<Record<string, ActivePanel>>({});
  const completeInFlightRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => subscribeAllMailVorgaenge(() => setMailRevision((tick) => tick + 1)), []);
  useEffect(() => subscribeHiddenVorgaenge(() => setMailRevision((tick) => tick + 1)), []);
  useEffect(() => subscribeVorgaengeCounts(() => setCountsRevision((tick) => tick + 1)), []);
  useEffect(() => subscribeHelpyReportReads(() => setCountsRevision((tick) => tick + 1)), []);
  useEffect(() => subscribeSnoozedVorgaenge(() => setMailRevision((tick) => tick + 1)), []);
  useEffect(() => subscribePriorityOverrides(() => setMailRevision((tick) => tick + 1)), []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setMailReady(true);
      return;
    }

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
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
        // OAuth-Sync optional.
      }

      const outlookStatus = await refreshOutlookConnectionStatus();
      if (outlookStatus.status === "connected") {
        await loadOutlookVorgaenge();
      }

      setMailReady(true);
      void loadDbVorgaengeFromApi().then(() => {
        setMailRevision((tick) => tick + 1);
      });

      void fetch("/api/kunden", { cache: "no-store" })
        .then((response) => response.json())
        .then((payload: { customers?: import("@/features/customers/mock/mock-customers").Customer[] }) => {
          if (payload.customers) {
            setDbKundenCustomers(payload.customers);
            setCustomersRevision((tick) => tick + 1);
          }
        })
        .catch(() => undefined);
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
    let filtered = filterVorgaenge(allVorgaenge, activeFilter);
    filtered = filterNotSnoozed(filtered);
    filtered = filtered.map(applyPriorityOverride);

    if (quickFilter === "heute") {
      const heuteIds = new Set(filterHeuteZuErledigen(filtered).map((item) => item.id));
      filtered = filtered.filter((item) => heuteIds.has(item.id));
    }

    const { vorgaenge } = deduplicateVorgaenge(filtered);
    if (activeFilter === "helpy_reports" || activeFilter === "helpy_phone") {
      return vorgaenge;
    }
    return sortDeduplicatedVorgaenge(vorgaenge);
  }, [activeFilter, allVorgaenge, quickFilter]);

  const actionableVorgaenge = useMemo(
    () =>
      filteredVorgaenge.filter(
        (item) =>
          !isHelpyReportVorgang(item) &&
          getEffectiveVorgangStatus(item) !== "erledigt"
      ),
    [filteredVorgaenge]
  );

  const openVorgaengeCount = useMemo(
    () =>
      allVorgaenge.filter(
        (item) =>
          !isHelpyReportVorgang(item) &&
          getEffectiveVorgangStatus(item) !== "erledigt"
      ).length,
    [allVorgaenge]
  );

  const selectedVorgang = useMemo(
    () =>
      selectedDetailId
        ? filteredVorgaenge.find((item) => item.id === selectedDetailId) ?? null
        : null,
    [filteredVorgaenge, selectedDetailId]
  );

  const focusedVorgang = actionableVorgaenge[focusedIndex] ?? null;

  useEffect(() => {
    if (focusedIndex >= actionableVorgaenge.length) {
      setFocusedIndex(Math.max(0, actionableVorgaenge.length - 1));
    }
  }, [actionableVorgaenge.length, focusedIndex]);

  const customers = useMemo(
    () => getDbKundenCustomers(),
    [customersRevision, createModalOpen]
  );

  const isLoading = mounted && (!mailReady || isMailSyncLoading());
  const showAllDoneEmpty =
    !isLoading &&
    activeFilter === "alle" &&
    quickFilter === "none" &&
    openVorgaengeCount === 0;

  const handleCompleted = useCallback((message: string, helpyPanelMessage: string) => {
    setSuccessMessage(message);
    setPanelMessage(helpyPanelMessage);
    setMailRevision((tick) => tick + 1);
    window.setTimeout(() => setSuccessMessage(null), 4000);
  }, []);

  const handleKeyboardComplete = useCallback(async () => {
    const target = focusedVorgang;
    if (!target || completeInFlightRef.current) return;
    completeInFlightRef.current = true;
    const supabase = createClient();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    const result = await completeVorgang(target, session?.provider_token);
    completeInFlightRef.current = false;
    if (result.ok) {
      handleCompleted(result.message, result.helpyPanelMessage);
    }
  }, [focusedVorgang, handleCompleted]);

  const setPanelForFocused = useCallback(
    (panel: ActivePanel) => {
      if (!focusedVorgang) return;
      setCardPanelById((prev) => ({ ...prev, [focusedVorgang.id]: panel }));
    },
    [focusedVorgang]
  );

  const isSplitView = Boolean(selectedDetailId && selectedVorgang);

  return (
    <DashboardShell
      activeHref="/vorgaenge"
      rightPanel={
        isSplitView ? null : (
          <HelpyVorgaengePanel
            allVorgaenge={allVorgaenge}
            summary={brainSummary}
            useMailSource={useMailSource}
            panelMessage={panelMessage}
          />
        )
      }
    >
      <VorgaengeKeyboardShortcuts
        enabled={mounted && !shortcutsHelpOpen}
        onComplete={() => {
          void handleKeyboardComplete();
        }}
        onReply={() => setPanelForFocused("reply")}
        onAppointment={() => setPanelForFocused("appointment")}
        onEscape={() => {
          setSelectedDetailId(null);
          setCardPanelById({});
          setShortcutsHelpOpen(false);
        }}
        onNavigate={(direction) => {
          setFocusedIndex((index) => {
            if (actionableVorgaenge.length === 0) return 0;
            if (direction === "up") return Math.max(0, index - 1);
            return Math.min(actionableVorgaenge.length - 1, index + 1);
          });
        }}
        onToggleOpen={() => {
          if (!focusedVorgang) return;
          setSelectedDetailId((current) =>
            current === focusedVorgang.id ? null : focusedVorgang.id
          );
        }}
        onShowHelp={() => setShortcutsHelpOpen(true)}
      />

      <ShortcutsHelpModal
        open={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
      />

      <div
        className={cn(
          "mx-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-12",
          isSplitView ? "max-w-[1600px]" : "max-w-4xl"
        )}
      >
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
              Arbeit zentral
            </p>
            <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.035em] text-[#0F172A] lg:text-[2.25rem]">
              {vorgaengeLabel}
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#64748B]">
              Schnell erledigen, antworten und planen — direkt auf der Karte.
              <span className="hidden lg:inline"> Tastatur: </span>
              <kbd className="ml-1 hidden rounded border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-0.5 font-mono text-[10px] lg:inline">
                ?
              </kbd>
            </p>
          </div>
          <Button className="shrink-0" onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 size-4" />
            Neuen Vorgang erstellen
          </Button>
        </header>

        {successMessage ? (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
            {successMessage}
          </p>
        ) : null}

        <div className="mb-4 -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full flex-nowrap gap-1.5 sm:flex-wrap">
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
                  <span className="mr-1.5 inline-flex align-middle">
                    <HelpyCharacter size={14} variant="head" animated={false} showLabel={false} />
                  </span>
                )}
                {filter === "helpy_phone" && (
                  <Phone className="mr-1.5 inline size-3.5 -translate-y-px align-middle" strokeWidth={2.25} />
                )}
                {filterLabels[filter]}
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
        </div>

        <div className="mb-5">
          <button
            type="button"
            onClick={() =>
              setQuickFilter((current) => (current === "heute" ? "none" : "heute"))
            }
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all",
              quickFilter === "heute"
                ? "border-[#F59E0B]/40 bg-[#FFFBEB] text-[#B45309] shadow-sm"
                : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]"
            )}
          >
            <Sparkles className="size-3.5" />
            Heute zu erledigen
          </button>
        </div>

        <VorgaengeBulkBar
          vorgaenge={filteredVorgaenge}
          onCompleted={handleCompleted}
          className="mb-4"
        />

        <div
          className={cn(
            "gap-5",
            isSplitView ? "grid lg:grid-cols-[minmax(280px,380px)_1fr]" : "block"
          )}
        >
          <div className={cn("space-y-3", isSplitView && "lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1")}>
            {isLoading ? (
              <div className="rounded-[20px] border border-dashed border-[#CBD5E1] bg-white/70 px-8 py-16 text-center backdrop-blur-xl">
                <p className="text-sm font-medium text-[#64748B]">
                  HELPY lädt deine Vorgänge…
                </p>
              </div>
            ) : showAllDoneEmpty ? (
              <div className="rounded-[24px] border border-[#A7F3D0]/50 bg-gradient-to-br from-[#ECFDF5]/80 to-white px-8 py-20 text-center backdrop-blur-xl">
                <p className="text-4xl">🎉</p>
                <p className="mt-4 text-xl font-semibold text-[#0F172A]">
                  Alle Vorgänge erledigt!
                </p>
                <p className="mt-2 text-[14px] text-[#64748B]">
                  HELPY überwacht weiter deine Mails.
                </p>
              </div>
            ) : filteredVorgaenge.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#CBD5E1] bg-white/70 px-8 py-16 text-center backdrop-blur-xl">
                <p className="text-sm font-medium text-[#64748B]">
                  Keine Vorgänge in diesem Filter.
                </p>
              </div>
            ) : (
              filteredVorgaenge.map((vorgang) => {
                const actionIndex = actionableVorgaenge.findIndex(
                  (item) => item.id === vorgang.id
                );
                const isFocused = actionIndex === focusedIndex;

                return isHelpyReportVorgang(vorgang) ? (
                  <HelpyReportCard key={vorgang.id} vorgang={vorgang} />
                ) : (
                  <VorgangCard
                    key={vorgang.id}
                    vorgang={vorgang}
                    focused={isFocused}
                    selectedDetailId={selectedDetailId}
                    externalPanel={cardPanelById[vorgang.id] ?? "none"}
                    onExternalPanelChange={(panel) => {
                      setCardPanelById((prev) => ({ ...prev, [vorgang.id]: panel }));
                    }}
                    onOpen={(id) => {
                      setSelectedDetailId(id);
                      if (actionIndex >= 0) setFocusedIndex(actionIndex);
                    }}
                    onCompleted={handleCompleted}
                    onRequestReply={(id) => {
                      setCardPanelById((prev) => ({ ...prev, [id]: "reply" }));
                    }}
                    onRequestAppointment={(id) => {
                      setCardPanelById((prev) => ({ ...prev, [id]: "appointment" }));
                    }}
                  />
                );
              })
            )}
          </div>

          {isSplitView && selectedVorgang ? (
            <div className="hidden min-h-[calc(100vh-12rem)] lg:block">
              <VorgangSplitDetail
                vorgang={selectedVorgang}
                onClose={() => setSelectedDetailId(null)}
                onCompleted={handleCompleted}
                className="h-full"
              />
            </div>
          ) : null}
        </div>
      </div>

      {selectedVorgang && selectedDetailId ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-white lg:hidden">
          <MobileBackHeader
            title={selectedVorgang.titel}
            subtitle={selectedVorgang.kunde}
            onBack={() => setSelectedDetailId(null)}
          />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <VorgangSplitDetail
              vorgang={selectedVorgang}
              onClose={() => setSelectedDetailId(null)}
              onCompleted={handleCompleted}
              showHeader={false}
              className="h-auto min-h-full rounded-none border-0 shadow-none"
            />
          </div>
        </div>
      ) : null}

      <CreateVorgangModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        customers={customers}
        onCreated={(message) => {
          setSuccessMessage(message);
          setMailRevision((tick) => tick + 1);
          window.setTimeout(() => setSuccessMessage(null), 4000);
        }}
      />
    </DashboardShell>
  );
}
