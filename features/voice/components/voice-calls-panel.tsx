"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Mic, PhoneIncoming, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import {
  fetchVoiceCallsDashboard,
  type VoiceCallListItem,
  type VoiceCallWorkflowStatus,
} from "@/features/voice/services/voice-settings-client";
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

function CallDetailModal({
  call,
  onClose,
}: {
  call: VoiceCallListItem | null;
  onClose: () => void;
}) {
  if (!call) return null;

  const turns = call.transcriptTurns ?? [];
  const vorgangHref = call.vorgangId ? `/workspace/${call.vorgangId}` : null;

  return (
    <Modal
      open={Boolean(call)}
      title={`Anruf vom ${formatDate(call.startedAt)} um ${formatTime(call.startedAt)}`}
      description={`Dauer: ${formatDuration(call.durationSeconds)} · Anliegen: ${call.intentLabel ?? "—"}`}
      onClose={onClose}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {call.summary ? (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Zusammenfassung
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              {call.summary}
            </p>
          </section>
        ) : null}

        <section>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Vollständiges Transkript
          </p>
          {turns.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {turns.map((turn, index) => (
                <li
                  key={`${turn.at}-${index}`}
                  className={cn(
                    "rounded-[14px] px-4 py-3 text-[13px] leading-relaxed",
                    turn.role === "helpy"
                      ? "helpy-chat-bubble"
                      : "bg-[var(--background-secondary)] text-[var(--text-secondary)]"
                  )}
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {turn.role === "helpy" ? (
                      <>
                        <Sparkles className="size-3" />
                        HELPY
                      </>
                    ) : (
                      <>
                        <Mic className="size-3" />
                        Anrufer
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-[var(--text-primary)]">{turn.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {call.transcript ?? "Kein Transkript vorhanden."}
            </p>
          )}
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

      <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />
    </>
  );
}
