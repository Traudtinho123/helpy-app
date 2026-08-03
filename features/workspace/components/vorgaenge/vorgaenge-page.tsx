"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { CreateVorgangModal } from "@/features/vorgaenge/components/create-vorgang-modal";
import { getDbKundenCustomers, setDbKundenCustomers } from "@/features/customers/services/kunden-store";
import {
  hydrateMailVorgaengeCaches,
  syncMailVorgaengeSources,
} from "@/features/mail/services/mail-vorgaenge-sync-client";
import { MobileBackHeader } from "@/components/mobile/mobile-back-header";
import { VorgangArchiveCard } from "@/features/workspace/components/vorgaenge/vorgang-archive-card";
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
import {
  buildArchiveVorgangFilterCounts,
  buildRealVorgangFilterCounts,
  filterEchteVorgaenge,
  filterArchiveVorgaenge,
} from "@/features/workspace/services/vorgaenge/vorgang-archive";
import { deleteArchivedVorgaengeOlderThanDays, countArchivedVorgaengeOlderThan } from "@/features/workspace/services/vorgaenge/vorgang-restore-service";
import {
  ARCHIVE_VORGANG_FILTER_LABELS,
  REAL_VORGANG_FILTER_LABELS,
  type ArchiveVorgangFilter,
  type RealVorgangFilter,
  type VorgaengeMainArea,
} from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

const realFilterOrder: RealVorgangFilter[] = [
  "alle",
  "neu",
  "besichtigungen",
  "anfragen",
  "in_bearbeitung",
  "wartend",
  "erledigt",
];

const archiveFilterOrder: ArchiveVorgangFilter[] = [
  "alle",
  "newsletter",
  "werbung",
  "system",
  "spam",
];

type ActivePanel = "none" | "reply" | "appointment";

export function VorgaengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mainArea, setMainArea] = useState<VorgaengeMainArea>("vorgaenge");
  const [realFilter, setRealFilter] = useState<RealVorgangFilter>("alle");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveVorgangFilter>("alle");
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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (
      urlFilter === "plattformen" ||
      urlFilter === "immoscout" ||
      urlFilter === "homegate"
    ) {
      setMainArea("vorgaenge");
      setRealFilter("anfragen");
    }
    if (urlFilter === "archiv") {
      setMainArea("archiv");
    }
  }, [searchParams]);

  useEffect(() => subscribeAllMailVorgaenge(() => setMailRevision((tick) => tick + 1)), []);
  useEffect(() => subscribeHiddenVorgaenge(() => setMailRevision((tick) => tick + 1)), []);
  useEffect(() => subscribeVorgaengeCounts(() => setCountsRevision((tick) => tick + 1)), []);
  useEffect(() => subscribeHelpyReportReads(() => setCountsRevision((tick) => tick + 1)), []);
  useEffect(() => subscribeSnoozedVorgaenge(() => setMailRevision((tick) => tick + 1)), []);
  useEffect(() => subscribePriorityOverrides(() => setMailRevision((tick) => tick + 1)), []);

  useEffect(() => {
    hydrateMailVorgaengeCaches();
    setMailReady(true);
    setMailRevision((tick) => tick + 1);

    const supabase = createClient();
    if (!supabase) return;

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        await syncMailVorgaengeSources(session);
      } finally {
        setMailRevision((tick) => tick + 1);
      }

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

  const centralSummary = useMemo(
    () => buildVorgaengeCentralSummary(allVorgaenge),
    [allVorgaenge, countsRevision]
  );

  const realFilterCounts = useMemo(
    () => buildRealVorgangFilterCounts(allVorgaenge),
    [allVorgaenge, countsRevision]
  );

  const archiveFilterCounts = useMemo(
    () => buildArchiveVorgangFilterCounts(allVorgaenge),
    [allVorgaenge, countsRevision]
  );

  const filteredVorgaenge = useMemo(() => {
    let filtered =
      mainArea === "archiv"
        ? filterArchiveVorgaenge(allVorgaenge, archiveFilter)
        : filterEchteVorgaenge(allVorgaenge, realFilter);

    filtered = filterNotSnoozed(filtered);
    filtered = filtered.map(applyPriorityOverride);

    if (mainArea === "vorgaenge" && quickFilter === "heute") {
      const heuteIds = new Set(filterHeuteZuErledigen(filtered).map((item) => item.id));
      filtered = filtered.filter((item) => heuteIds.has(item.id));
    }

    const { vorgaenge } = deduplicateVorgaenge(filtered);
    return mainArea === "archiv"
      ? vorgaenge.sort(
          (a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt)
        )
      : sortDeduplicatedVorgaenge(vorgaenge);
  }, [allVorgaenge, archiveFilter, mainArea, quickFilter, realFilter]);

  const actionableVorgaenge = useMemo(
    () =>
      filteredVorgaenge.filter(
        (item) =>
          mainArea === "vorgaenge" &&
          !isHelpyReportVorgang(item) &&
          getEffectiveVorgangStatus(item) !== "erledigt"
      ),
    [filteredVorgaenge, mainArea]
  );

  const openVorgaengeCount = useMemo(
    () => centralSummary.active,
    [centralSummary.active]
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

  const hasCachedMail = useMemo(() => {
    if (!mounted || !mailReady) return false;
    return hasMailVorgaenge();
  }, [mounted, mailReady, mailRevision]);

  const isLoading =
    mounted &&
    (!mailReady || (isMailSyncLoading() && !hasCachedMail));
  const showAllDoneEmpty =
    !isLoading &&
    mainArea === "vorgaenge" &&
    realFilter === "alle" &&
    quickFilter === "none" &&
    openVorgaengeCount === 0;

  const showArchiveEmpty =
    !isLoading && mainArea === "archiv" && filteredVorgaenge.length === 0;

  const archiveOlderThan30Count = useMemo(
    () =>
      countArchivedVorgaengeOlderThan(
        filterArchiveVorgaenge(allVorgaenge, "alle"),
        30
      ),
    [allVorgaenge, countsRevision]
  );

  const handleBulkDeleteOlderThan30 = async () => {
    setBulkDeleteBusy(true);
    const count = await deleteArchivedVorgaengeOlderThanDays(
      filterArchiveVorgaenge(allVorgaenge, "alle"),
      30
    );
    setBulkDeleteBusy(false);
    setBulkDeleteOpen(false);
    if (count > 0) {
      setSuccessMessage(`${count} archivierte Mails gelöscht.`);
      setMailRevision((tick) => tick + 1);
    }
  };

  const completeInFlightRef = useRef(false);

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
        isSplitView || mainArea === "archiv" ? null : (
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
            <p className="text-[11px] font-bold tracking-[0.15em] text-[var(--text-accent)] uppercase">
              Arbeit zentral
            </p>
            <h1 className="helpy-display mt-2 text-[2rem] font-semibold tracking-[-0.035em] text-[var(--text-primary)] lg:text-[2.25rem]">
              Aufgaben & To-Dos
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Deine offenen Aufgaben — antworten, erledigen und planen.
            </p>
          </div>
          <Button className="shrink-0" onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 size-4" />
            Neuen Vorgang erstellen
          </Button>
        </header>

        {successMessage ? (
          <p className="mb-4 rounded-lg border border-[var(--success-light)] bg-[var(--success-light)] px-4 py-3 text-[13px] text-[var(--success)]">
            {successMessage}
          </p>
        ) : null}

        <div className="mb-4 flex gap-2">
          {(
            [
              { id: "vorgaenge", label: "📋 Vorgänge" },
              { id: "archiv", label: "🗄️ Zu archivieren" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMainArea(tab.id)}
              className={cn(
                "min-h-[44px] flex-1 rounded-[14px] border px-4 py-2.5 text-[14px] font-semibold transition-all",
                mainArea === tab.id
                  ? "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--text-accent)] shadow-[var(--shadow-accent)]"
                  : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
              )}
            >
              {tab.label}
              <span className="ml-2 tabular-nums opacity-70">
                {tab.id === "vorgaenge"
                  ? realFilterCounts.alle
                  : archiveFilterCounts.alle}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-4 -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full flex-nowrap gap-1.5 sm:flex-wrap">
            {mainArea === "vorgaenge"
              ? realFilterOrder.map((filter) => {
                  const isActive = realFilter === filter;
                  const count = realFilterCounts[filter];
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setRealFilter(filter)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-150",
                        isActive
                          ? "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--text-accent)] shadow-[var(--shadow-accent)]"
                          : "border-transparent bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {REAL_VORGANG_FILTER_LABELS[filter]}
                      {mounted && (
                        <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                      )}
                    </button>
                  );
                })
              : archiveFilterOrder.map((filter) => {
                  const isActive = archiveFilter === filter;
                  const count = archiveFilterCounts[filter];
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setArchiveFilter(filter)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-150",
                        isActive
                          ? "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--text-accent)] shadow-[var(--shadow-accent)]"
                          : "border-transparent bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {ARCHIVE_VORGANG_FILTER_LABELS[filter]}
                      {mounted && (
                        <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                      )}
                    </button>
                  );
                })}
          </div>
        </div>

        {mainArea === "vorgaenge" ? (
          <div className="mb-5">
            <button
              type="button"
              onClick={() =>
                setQuickFilter((current) => (current === "heute" ? "none" : "heute"))
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                quickFilter === "heute"
                  ? "border-[var(--warning-light)] bg-[var(--warning-light)] text-[var(--warning)]"
                  : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              )}
            >
              <Sparkles className="size-3.5" />
              Heute zu erledigen
            </button>
          </div>
        ) : (
          <div className="mb-5">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] rounded-[10px] text-[13px]"
              disabled={archiveOlderThan30Count === 0}
              onClick={() => setBulkDeleteOpen(true)}
            >
              Alle älter als 30 Tage löschen
            </Button>
          </div>
        )}

        {mainArea === "vorgaenge" ? (
          <VorgaengeBulkBar
            vorgaenge={filteredVorgaenge}
            onCompleted={handleCompleted}
            className="mb-4"
          />
        ) : null}

        <div
          className={cn(
            "gap-5",
            isSplitView ? "grid lg:grid-cols-[minmax(280px,380px)_1fr]" : "block"
          )}
        >
          <div className={cn("space-y-3", isSplitView && "lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1")}>
            {isLoading ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-8 py-16 text-center">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  HELPY lädt deine Vorgänge…
                </p>
              </div>
            ) : showAllDoneEmpty ? (
              <div className="rounded-xl border border-[var(--success-light)] bg-[var(--bg-surface)] px-8 py-20 text-center">
                <p className="text-4xl">🎉</p>
                <p className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  Alle Vorgänge erledigt!
                </p>
                <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                  HELPY überwacht weiter deine Mails.
                </p>
              </div>
            ) : showArchiveEmpty ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-8 py-16 text-center">
                <p className="text-2xl">✓</p>
                <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                  Noch keine archivierten Mails.
                </p>
                <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                  HELPY filtert Spam und Newsletter automatisch aus.
                </p>
              </div>
            ) : filteredVorgaenge.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-8 py-16 text-center">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Keine Vorgänge in diesem Filter.
                </p>
              </div>
            ) : (
              filteredVorgaenge.map((vorgang) => {
                const actionIndex = actionableVorgaenge.findIndex(
                  (item) => item.id === vorgang.id
                );
                const isFocused = actionIndex === focusedIndex;

                if (mainArea === "archiv") {
                  return (
                    <VorgangArchiveCard
                      key={vorgang.id}
                      vorgang={vorgang}
                      onChanged={() => setMailRevision((tick) => tick + 1)}
                    />
                  );
                }

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
                      router.push(`/workspace/${id}`);
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
        <div className="fixed inset-0 z-40 flex flex-col bg-[var(--bg-surface)] lg:hidden">
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

      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Alle älter als 30 Tage löschen?"
        description={`Alle ${archiveOlderThan30Count} Einträge älter als 30 Tage löschen?`}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] rounded-[10px]"
              disabled={bulkDeleteBusy}
              onClick={() => setBulkDeleteOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              className="min-h-[44px] rounded-[10px] bg-[#B91C1C] hover:bg-[#991B1B]"
              disabled={bulkDeleteBusy}
              onClick={() => void handleBulkDeleteOlderThan30()}
            >
              {bulkDeleteBusy ? "Lösche…" : "Alle löschen"}
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-[var(--text-secondary)]">
          Diese Einträge werden dauerhaft aus HELPY entfernt.
        </p>
      </Modal>
    </DashboardShell>
  );
}
