"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WhatsappConnectionHeader } from "@/features/whatsapp/components/whatsapp-connection-header";
import { WhatsappDetailPanel } from "@/features/whatsapp/components/whatsapp-detail-panel";
import { WhatsappHelpyPanel } from "@/features/whatsapp/components/whatsapp-helpy-panel";
import { WhatsappMessageCard } from "@/features/whatsapp/components/whatsapp-message-card";
import { WhatsappIcon } from "@/features/whatsapp/components/whatsapp-icon";
import {
  refreshWhatsappSummary,
  startWhatsappSummaryPolling,
} from "@/features/whatsapp/services/whatsapp-summary-store";
import type {
  WhatsappMessage,
  WhatsappMessageFilter,
  WhatsappSummary,
} from "@/features/whatsapp/types/whatsapp-types";
import { WHATSAPP_FILTER_LABELS } from "@/features/whatsapp/types/whatsapp-types";
import { cn } from "@/lib/utils";

const filterOrder: WhatsappMessageFilter[] = [
  "alle",
  "neu",
  "in_bearbeitung",
  "erledigt",
  "archiviert",
];

const EMPTY_SUMMARY: WhatsappSummary = {
  openCount: 0,
  neuCount: 0,
  inBearbeitungCount: 0,
  erledigtCount: 0,
  archiviertCount: 0,
  todayCount: 0,
  weekCount: 0,
  connected: false,
  displayNumber: null,
};

export function WhatsappPage() {
  const [activeFilter, setActiveFilter] = useState<WhatsappMessageFilter>("alle");
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<WhatsappSummary>(EMPTY_SUMMARY);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadData = useCallback(async (filter: WhatsappMessageFilter) => {
    const [messagesRes, summaryRes, connectionRes] = await Promise.all([
      fetch(`/api/whatsapp/messages?filter=${filter}`, { cache: "no-store" }),
      fetch("/api/whatsapp/summary", { cache: "no-store" }),
      fetch("/api/whatsapp/connection", { cache: "no-store" }),
    ]);

    if (messagesRes.ok) {
      const payload = (await messagesRes.json()) as { messages: WhatsappMessage[] };
      setMessages(payload.messages ?? []);
    }

    if (summaryRes.ok) {
      setSummary((await summaryRes.json()) as WhatsappSummary);
    }

    if (connectionRes.ok) {
      const connection = (await connectionRes.json()) as { configured?: boolean };
      setConfigured(Boolean(connection.configured));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      await loadData(activeFilter);
      if (!cancelled) setLoading(false);
    })();

    const stopPolling = startWhatsappSummaryPolling();

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [activeFilter, loadData]);

  const filterCounts = useMemo(
    () => ({
      alle:
        summary.neuCount +
        summary.inBearbeitungCount +
        summary.erledigtCount +
        summary.archiviertCount,
      neu: summary.neuCount,
      in_bearbeitung: summary.inBearbeitungCount,
      erledigt: summary.erledigtCount,
      archiviert: summary.archiviertCount,
    }),
    [summary]
  );

  const selectedMessage = useMemo(
    () => messages.find((item) => item.id === selectedId) ?? null,
    [messages, selectedId]
  );

  async function handleStatusChange(id: string, status: WhatsappMessage["status"]) {
    setUpdating(true);
    try {
      const response = await fetch(`/api/whatsapp/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const payload = (await response.json()) as { message: WhatsappMessage };
        setMessages((current) =>
          current.map((item) => (item.id === id ? payload.message : item))
        );
        await loadData(activeFilter);
        await refreshWhatsappSummary();
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <DashboardShell
      activeHref="/whatsapp"
      rightPanel={
        <WhatsappHelpyPanel messages={messages} selectedMessage={selectedMessage} />
      }
    >
      <div className="mx-auto max-w-6xl px-8 py-12 lg:px-12 lg:py-14">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <WhatsappIcon size={22} />
            <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#25D366]">
              Kommunikation
            </p>
          </div>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.035em] text-[#0F172A] lg:text-[2.25rem]">
            Helpy-WhatsApp
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#64748B]">
            WhatsApp Business Nachrichten — eigenständige Inbox mit HELPY-Klassifikation,
            ohne Vermischung mit E-Mail-Vorgängen.
          </p>
        </header>

        <WhatsappConnectionHeader
          summary={summary}
          configured={configured}
          onConnected={() => void loadData(activeFilter)}
        />

        <div className="mb-6 flex flex-wrap gap-1.5">
          {filterOrder.map((filter) => {
            const isActive = activeFilter === filter;
            const count = filterCounts[filter];

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-300",
                  isActive
                    ? "border-[#25D366]/30 bg-[#ECFDF3] text-[#15803D] shadow-sm"
                    : "border-transparent bg-white/80 text-[#64748B] hover:border-[#CBD5E1]/60 hover:bg-white"
                )}
              >
                {WHATSAPP_FILTER_LABELS[filter]}
                <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {loading ? (
              <div className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-white/70 px-8 py-16 text-center backdrop-blur-xl">
                <p className="text-sm font-medium text-[#64748B]">
                  WhatsApp-Inbox wird geladen…
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-white/70 px-8 py-16 text-center backdrop-blur-xl">
                <WhatsappIcon size={28} className="mx-auto opacity-60" />
                <p className="mt-4 text-sm font-medium text-[#64748B]">
                  Keine WhatsApp-Nachrichten in diesem Filter.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <WhatsappMessageCard
                  key={message.id}
                  message={message}
                  selected={selectedId === message.id}
                  onSelect={(item) => setSelectedId(item.id)}
                />
              ))
            )}
          </div>

          <WhatsappDetailPanel
            message={selectedMessage}
            onStatusChange={(id, status) => void handleStatusChange(id, status)}
            updating={updating}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
