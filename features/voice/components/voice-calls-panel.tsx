"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  PhoneIncoming,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { CreateCustomerModal } from "@/features/customers/components/create-customer-modal";
import type { Customer } from "@/features/customers/mock/mock-customers";
import {
  lookupCustomerByPhone,
} from "@/features/customers/services/kunden-client";
import {
  findDbCustomerByPhone,
  prependDbKundeCustomer,
} from "@/features/customers/services/kunden-store";
import {
  createVoiceCallVorgang,
  generateVoiceCallSummary,
  fetchVoiceCallsDashboard,
  type VoiceCallListItem,
  type VoiceCallWorkflowStatus,
} from "@/features/voice/services/voice-settings-client";
import { ingestVoiceProcessedCall } from "@/features/voice/services/voice-vorgaenge-store";
import type { VoiceTranscriptTurn } from "@/features/voice/types/voice-types";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs} Sek`;
  return `${mins} Min ${secs} Sek`;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function workflowLabel(status: VoiceCallWorkflowStatus | undefined): string {
  switch (status) {
    case "erledigt":
      return "Erledigt";
    case "vorgang_vorbereitet":
      return "Vorgang erstellt";
    default:
      return "Offen";
  }
}

function workflowClass(status: VoiceCallWorkflowStatus | undefined): string {
  switch (status) {
    case "erledigt":
      return "bg-[var(--success-light)] text-[var(--success)]";
    case "vorgang_vorbereitet":
      return "bg-[var(--primary-light)] text-[var(--primary)]";
    default:
      return "bg-[var(--background-secondary)] text-[var(--text-secondary)]";
  }
}

function TranscriptTurnItem({ turn }: { turn: VoiceTranscriptTurn }) {
  const isHelpy = turn.role === "helpy";

  return (
    <li className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-[16px]" aria-hidden>
        {isHelpy ? "🤖" : "🎙"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-[var(--text-muted)]">
          {isHelpy ? "HELPY" : "Anrufer"} ({formatTime(turn.at)})
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-primary)]">
          &ldquo;{turn.text}&rdquo;
        </p>
      </div>
    </li>
  );
}

function CallDetailModal({
  call,
  onClose,
  onSummaryGenerated,
  onVorgangCreated,
}: {
  call: VoiceCallListItem | null;
  onClose: () => void;
  onSummaryGenerated: (callId: string, summary: string) => void;
  onVorgangCreated: (callId: string, vorgangId: string) => void;
}) {
  const router = useRouter();
  const [showTranscript, setShowTranscript] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [vorgangId, setVorgangId] = useState<string | null>(null);
  const [vorgangLoading, setVorgangLoading] = useState(false);
  const [vorgangError, setVorgangError] = useState<string | null>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [autoCreated, setAutoCreated] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const [customerCreatedInSession, setCustomerCreatedInSession] = useState(false);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [customerCreatedMessage, setCustomerCreatedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!call) return;
    setShowTranscript(false);
    setSummary(call.summary?.trim() ?? null);
    setSummaryError(null);
    setSummaryLoading(false);
    setVorgangId(call.vorgangId ?? null);
    setVorgangError(null);
    setVorgangLoading(false);
    setCustomerCreatedMessage(null);
    setCustomerCreatedInSession(false);
    setAutoCreated(
      Boolean(call.vorgangId) &&
        call.classification === "besichtigung_anfrage"
    );

    if (!call.callerPhone) {
      setLinkedCustomer(null);
      return;
    }

    const localMatch = findDbCustomerByPhone(call.callerPhone);
    if (localMatch) {
      setLinkedCustomer(localMatch);
      return;
    }

    let cancelled = false;
    setCustomerLookupLoading(true);

    void lookupCustomerByPhone(call.callerPhone).then((remote) => {
      if (cancelled) return;
      if (remote) {
        prependDbKundeCustomer(remote);
        setLinkedCustomer(remote);
      } else {
        setLinkedCustomer(null);
      }
      setCustomerLookupLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [call]);

  useEffect(() => {
    if (!call || summary?.trim()) return;

    let cancelled = false;

    const run = async () => {
      setSummaryLoading(true);
      setSummaryError(null);

      const result = await generateVoiceCallSummary(call.id);

      if (cancelled) return;

      if ("summary" in result) {
        setSummary(result.summary);
        onSummaryGenerated(call.id, result.summary);
      } else {
        setSummaryError(result.error);
      }

      setSummaryLoading(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [call, summary, onSummaryGenerated]);

  const handleCreateVorgang = useCallback(async () => {
    if (!call || vorgangId) return;

    setVorgangLoading(true);
    setVorgangError(null);

    const result = await createVoiceCallVorgang(call.id);

    setVorgangLoading(false);

    if (!result.ok) {
      setVorgangError(result.error);
      return;
    }

    if (result.processed) {
      ingestVoiceProcessedCall(result.processed);
    }

    setVorgangId(result.vorgangId);
    onVorgangCreated(call.id, result.vorgangId);
  }, [call, onVorgangCreated, vorgangId]);

  const handleCustomerAction = useCallback(() => {
    if (!call?.callerPhone) return;

    if (linkedCustomer) {
      router.push(
        `/kunden?select=${encodeURIComponent(linkedCustomer.id)}&phone=${encodeURIComponent(call.callerPhone)}`
      );
      return;
    }

    setCustomerModalOpen(true);
  }, [call?.callerPhone, linkedCustomer, router]);

  const handleCustomerCreated = useCallback((customer: Customer) => {
    prependDbKundeCustomer(customer);
    setLinkedCustomer(customer);
    setCustomerCreatedInSession(true);
    setCustomerCreatedMessage(`✓ Kunde angelegt: ${customer.contactPerson}`);
  }, []);

  const customerHref = linkedCustomer
    ? `/kunden?select=${encodeURIComponent(linkedCustomer.id)}${call?.callerPhone ? `&phone=${encodeURIComponent(call.callerPhone)}` : ""}`
    : null;
  const hasLinkedCustomer = Boolean(linkedCustomer);

  if (!call) return null;

  const turns = call.transcriptTurns ?? [];
  const vorgangHref = vorgangId ? `/workspace/${vorgangId}` : null;
  const anliegenLabel =
    call.classificationLabel ?? call.intentLabel ?? "Allgemeine Anfrage";
  const hasVorgang = Boolean(vorgangId);

  return (
    <>
      <Modal
        open={Boolean(call)}
        title="Anrufdetails"
        onClose={onClose}
        maxWidth="lg"
      >
        <div className="space-y-6">
          <section className="rounded-[16px] border border-[var(--card-border)] bg-[var(--background-secondary)]/40 px-4 py-4">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">
              📞 Anruf vom {formatDate(call.startedAt)} um {formatTime(call.startedAt)}
            </p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              Dauer: {formatDuration(call.durationSeconds)} | Anliegen: {anliegenLabel}
            </p>

            <div className="mt-4 border-t border-[var(--card-border)] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Zusammenfassung
              </p>
              {summaryLoading ? (
                <div className="mt-2 flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                  <Loader2 className="size-4 animate-spin" />
                  Zusammenfassung wird erstellt…
                </div>
              ) : summary ? (
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  {summary}
                </p>
              ) : (
                <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
                  {summaryError ?? "Keine Zusammenfassung verfügbar."}
                </p>
              )}
            </div>

            {hasVorgang ? (
              <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
                <CheckCircle2 className="mr-1 inline size-4 text-[var(--success)]" />
                {autoCreated
                  ? "Vorgang automatisch erstellt — "
                  : "Vorgang erstellt — "}
                <Link
                  href={vorgangHref!}
                  className="font-semibold text-[var(--primary)] hover:underline"
                >
                  → Vorgang öffnen
                </Link>
              </p>
            ) : null}

            {call.requestedDateTime ? (
              <p className="mt-2 flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
                <span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    Terminwunsch:
                  </span>{" "}
                  {call.requestedDateTime}
                </span>
              </p>
            ) : null}
          </section>

          <section>
            <button
              type="button"
              onClick={() => setShowTranscript((value) => !value)}
              className="flex w-full items-center justify-between rounded-[12px] border border-[var(--card-border)] px-4 py-3 text-left text-[13px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--background-secondary)]"
            >
              Vollständiges Transkript anzeigen
              <ChevronDown
                className={cn(
                  "size-4 text-[var(--text-muted)] transition-transform",
                  showTranscript && "rotate-180"
                )}
              />
            </button>

            {showTranscript ? (
              <div className="mt-3 rounded-[14px] border border-[var(--card-border)] bg-white px-4 py-4">
                {turns.length > 0 ? (
                  <ul className="space-y-4">
                    {turns.map((turn, index) => (
                      <TranscriptTurnItem key={`${turn.at}-${index}`} turn={turn} />
                    ))}
                  </ul>
                ) : (
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-secondary)]">
                    {call.transcript ?? "Kein Transkript vorhanden."}
                  </p>
                )}
              </div>
            ) : null}
          </section>

          {vorgangError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {vorgangError}
            </p>
          ) : null}

          {customerCreatedMessage ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
              {customerCreatedMessage}
              {customerHref ? (
                <>
                  {" "}
                  <Link href={customerHref} className="font-semibold underline">
                    Kundenakte öffnen
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-[var(--card-border)] pt-4">
            {hasVorgang && vorgangHref ? (
              <Link
                href={vorgangHref}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-[12px] font-semibold text-white"
              >
                <ExternalLink className="size-3.5" />
                → Vorgang öffnen
              </Link>
            ) : null}

            {hasVorgang ? null : (
              <Button
                size="sm"
                disabled={vorgangLoading || call.status !== "completed"}
                onClick={() => void handleCreateVorgang()}
              >
                {vorgangLoading ? (
                  <>
                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                    Wird erstellt…
                  </>
                ) : (
                  "Vorgang erstellen"
                )}
              </Button>
            )}

            {hasVorgang ? (
              <Button size="sm" variant="outline" disabled className="text-[var(--success)]">
                <CheckCircle2 className="mr-1 size-3.5" />
                Vorgang erstellt
              </Button>
            ) : null}

            {hasLinkedCustomer && customerHref && !customerCreatedInSession ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(customerHref)}
              >
                Kundenakte öffnen
              </Button>
            ) : null}

            {!hasLinkedCustomer ? (
              <Button
                size="sm"
                variant="outline"
                disabled={!call.callerPhone || customerLookupLoading}
                onClick={handleCustomerAction}
              >
                {customerLookupLoading ? "Prüfe Nummer…" : "Kunde anlegen"}
              </Button>
            ) : customerCreatedInSession ? (
              <Button size="sm" variant="outline" disabled className="text-[var(--success)]">
                <CheckCircle2 className="mr-1 size-3.5" />
                Kunde angelegt
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={onClose}>
              Schliessen
            </Button>
          </div>
        </div>
      </Modal>

      <CreateCustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        defaults={{
          telefon: call.callerPhone ?? "",
          ...(call.callerName
            ? {
                vorname: call.callerName.split(/\s+/)[0] ?? "",
                nachname: call.callerName.split(/\s+/).slice(1).join(" ") || "",
              }
            : {}),
        }}
        onCreated={handleCustomerCreated}
      />
    </>
  );
}

export function VoiceCallsPanel() {
  const [calls, setCalls] = useState<VoiceCallListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<VoiceCallListItem | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const payload = await fetchVoiceCallsDashboard();
    setCalls(payload?.calls ?? []);
    setLoading(false);
  }, []);

  const handleSummaryGenerated = useCallback((callId: string, summary: string) => {
    setCalls((current) =>
      current.map((item) => (item.id === callId ? { ...item, summary } : item))
    );
    setSelectedCall((current) =>
      current?.id === callId ? { ...current, summary } : current
    );
  }, []);

  const handleVorgangCreated = useCallback((callId: string, vorgangId: string) => {
    setCalls((current) =>
      current.map((item) =>
        item.id === callId
          ? {
              ...item,
              vorgangId,
              hasPreparedVorgang: true,
              workflowStatus: "vorgang_vorbereitet" as const,
            }
          : item
      )
    );
    setSelectedCall((current) =>
      current?.id === callId
        ? {
            ...current,
            vorgangId,
            hasPreparedVorgang: true,
            workflowStatus: "vorgang_vorbereitet",
          }
        : current
    );
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
        <Loader2 className="size-4 animate-spin" />
        Gespräche laden…
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[var(--card-border)] bg-[var(--background-secondary)]/50 px-6 py-12 text-center text-[13px] text-[var(--text-secondary)]">
        Noch keine Gespräche protokolliert.
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {calls.map((call) => (
          <li key={call.id}>
            <button
              type="button"
              onClick={() => setSelectedCall(call)}
              className="helpy-glass-card helpy-glass-card-interactive w-full rounded-[16px] px-4 py-4 text-left"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-[var(--primary-light)]">
                    <PhoneIncoming className="size-4 text-[var(--primary)]" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                      {call.callerPhoneMasked ?? "Unbekannt"}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
                      {formatDateTime(call.startedAt)} · {formatDuration(call.durationSeconds)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {call.intentLabel ? (
                    <span className="rounded-full bg-[var(--primary-light)] px-2.5 py-1 text-[10px] font-semibold text-[var(--primary)]">
                      {call.intentLabel}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      workflowClass(call.workflowStatus)
                    )}
                  >
                    {workflowLabel(call.workflowStatus)}
                  </span>
                </div>
              </div>
              {call.summary ? (
                <p className="mt-3 line-clamp-2 text-[13px] text-[var(--text-secondary)]">
                  {call.summary}
                </p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <CallDetailModal
        call={selectedCall}
        onClose={() => setSelectedCall(null)}
        onSummaryGenerated={handleSummaryGenerated}
        onVorgangCreated={handleVorgangCreated}
      />
    </>
  );
}
