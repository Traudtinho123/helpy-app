"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, PhoneCall, PhoneIncoming } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { VoiceTwilioSetupSection } from "@/features/voice/components/voice-twilio-setup-section";
import {
  fetchVoiceCallsDashboard,
  fetchVoiceSettings,
  type VoiceCallListItem,
  type VoiceCallsDashboardPayload,
} from "@/features/voice/services/voice-settings-client";
import type { VoiceSettings } from "@/features/voice/types/voice-types";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")} min`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function ConnectionBadge({ ready }: { ready: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
        ready
          ? "bg-[var(--success-light)] text-[var(--success)]"
          : "bg-[var(--warning-light)] text-[var(--warning)]"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          ready ? "bg-[var(--success)]" : "bg-[var(--warning)]"
        )}
      />
      {ready ? "Twilio verbunden" : "Twilio nicht bereit"}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="helpy-glass-card rounded-[16px] px-4 py-3">
      <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-[28px] font-extrabold leading-none text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function TranscriptModal({
  call,
  onClose,
}: {
  call: VoiceCallListItem | null;
  onClose: () => void;
}) {
  if (!call) return null;

  const turns = call.transcriptTurns ?? [];

  return (
    <Modal
      open={Boolean(call)}
      title="Gesprächstranskript"
      description={`${call.callerPhoneMasked ?? "Unbekannt"} · ${formatDate(call.startedAt)}`}
      onClose={onClose}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {call.summary ? (
          <div className="rounded-[12px] bg-[var(--primary-light)]/60 px-4 py-3">
            <p className="text-[11px] font-semibold text-[var(--primary)] uppercase">
              Zusammenfassung
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{call.summary}</p>
          </div>
        ) : null}

        {turns.length > 0 ? (
          <ul className="space-y-3">
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
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {turn.role === "helpy" ? "HELPY" : "Anrufer"}
                </p>
                <p className="mt-1 text-[var(--text-primary)]">{turn.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {call.transcript ?? "Kein Transkript vorhanden."}
          </p>
        )}
      </div>
    </Modal>
  );
}

export function VoiceCallsDashboard() {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [dashboard, setDashboard] = useState<VoiceCallsDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<VoiceCallListItem | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const [settingsResult, dashboardResult] = await Promise.all([
      fetchVoiceSettings(),
      fetchVoiceCallsDashboard(),
    ]);
    setSettings(settingsResult);
    setDashboard(dashboardResult);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 30_000);
    return () => window.clearInterval(timer);
  }, [reload]);

  if (loading && !dashboard) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
        <Loader2 className="size-4 animate-spin" />
        Anrufe laden…
      </div>
    );
  }

  const connection = dashboard?.connection;
  const stats = dashboard?.stats ?? { today: 0, thisWeek: 0, total: 0 };
  const calls = dashboard?.calls ?? [];

  return (
    <div className="space-y-8">
      <section className="helpy-glass-card rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <PhoneCall className="size-3.5" />
              Verbindungsstatus
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ConnectionBadge ready={Boolean(connection?.ready)} />
              <span className="text-[12px] text-[var(--text-secondary)]">
                Nummer: {connection?.phoneNumber ?? "—"}
              </span>
            </div>
            {!connection?.openAiConfigured ? (
              <p className="mt-2 text-[12px] text-[var(--warning)]">
                OPENAI_API_KEY fehlt in der Umgebung.
              </p>
            ) : null}
            {!connection?.twilioConfigured ? (
              <p className="mt-2 text-[12px] text-[var(--warning)]">
                Twilio-Umgebungsvariablen fehlen.
              </p>
            ) : null}
            {connection?.twilioConfigured &&
            connection.openAiConfigured &&
            !connection.voiceEnabled ? (
              <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                Bitte HELPY Phone in den Einstellungen aktivieren und Twilio als Provider wählen.
              </p>
            ) : null}
          </div>
        </div>

        {settings ? (
          <div className="mt-5">
            <VoiceTwilioSetupSection
              settings={settings}
              onSettingsChange={(next) => {
                setSettings(next);
                void reload();
              }}
            />
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <StatCard label="Anrufe heute" value={stats.today} />
          <StatCard label="Diese Woche" value={stats.thisWeek} />
          <StatCard label="Gesamt (letzte 50)" value={stats.total} />
        </div>

        {calls.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[var(--card-border)] bg-[var(--background-secondary)]/50 px-6 py-12 text-center text-[13px] text-[var(--text-secondary)]">
            Noch keine Anrufe protokolliert. Sobald jemand Ihre Twilio-Nummer anruft, erscheinen
            die Gespräche hier.
          </div>
        ) : (
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
                          {formatDate(call.startedAt)} · {formatDuration(call.durationSeconds)}
                        </p>
                      </div>
                    </div>
                    {call.intentLabel ? (
                      <span className="rounded-full bg-[var(--primary-light)] px-2.5 py-1 text-[10px] font-semibold text-[var(--primary)]">
                        {call.intentLabel}
                      </span>
                    ) : null}
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
        )}
      </section>

      <TranscriptModal call={selectedCall} onClose={() => setSelectedCall(null)} />
    </div>
  );
}
