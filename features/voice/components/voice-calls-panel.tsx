"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  PhoneIncoming,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import {
  fetchVoiceCallsDashboard,
  generateVoiceCallSummary,
  type VoiceCallListItem,
  type VoiceCallWorkflowStatus,
} from "@/features/voice/services/voice-settings-client";
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
}: {
  call: VoiceCallListItem | null;
  onClose: () => void;
  onSummaryGenerated: (callId: string, summary: string) => void;
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!call) return;
    setShowTranscript(false);
    setSummary(call.summary?.trim() ?? null);
    setSummaryError(null);
    setSummaryLoading(false);
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

  if (!call) return null;

  const turns = call.transcriptTurns ?? [];
  const vorgangHref = call.vorgangId ? `/workspace/${call.vorgangId}` : null;
  const anliegenLabel =
    call.classificationLabel ?? call.intentLabel ?? "Allgemeine Anfrage";

  return (
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

          {vorgangHref ? (
            <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
              <CheckCircle2 className="mr-1 inline size-4 text-[var(--success)]" />
              Vorgang wurde erstellt —{" "}
              <Link
                href={vorgangHref}
                className="font-semibold text-[var(--primary)] hover:underline"
              >
                Zum Vorgang
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

        <div className="flex flex-wrap gap-2 border-t border-[var(--card-border)] pt-4">
          {vorgangHref ? (
            <Link
              href={vorgangHref}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-[var(--primary)] px-3 text-[12px] font-semibold text-white"
            >
              Vorgang erstellen
            </Link>
          ) : (
            <Button size="sm" disabled>
              Vorgang erstellen
            </Button>
          )}
          <Button size="sm" variant="outline" disabled>
            Kunde anlegen
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Schliessen
          </Button>
        </div>
      </div>
    </Modal>
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
      />
    </>
  );
}
