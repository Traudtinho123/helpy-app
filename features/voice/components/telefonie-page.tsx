"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { VoiceCallsDashboard } from "@/features/voice/components/voice-calls-dashboard";
import { VoiceMockPanel } from "@/features/voice/components/voice-mock-panel";
import { VoiceHistoryPanel } from "@/features/voice/components/voice-history-panel";
import { VoiceMemoryPanel } from "@/features/voice/components/voice-memory-panel";
import { VoiceProviderPanel } from "@/features/voice/components/voice-provider-panel";
import { VoiceSettingsPanel } from "@/features/voice/components/voice-settings-panel";
import { VoiceTranscriptsPanel } from "@/features/voice/components/voice-transcripts-panel";

export type TelefonieTabId =
  | "overview"
  | "mock"
  | "active"
  | "history"
  | "voicemail"
  | "transcripts"
  | "memory"
  | "provider"
  | "settings";

const TABS: { id: TelefonieTabId; label: string }[] = [
  { id: "overview", label: "Übersicht" },
  { id: "mock", label: "Mock Gespräch" },
  { id: "active", label: "Aktive Gespräche" },
  { id: "history", label: "Vergangene Gespräche" },
  { id: "voicemail", label: "Voicemail" },
  { id: "transcripts", label: "Transkripte" },
  { id: "memory", label: "Voice Memory" },
  { id: "provider", label: "Provider" },
  { id: "settings", label: "Einstellungen" },
];

export function TelefoniePage() {
  const [tab, setTab] = useState<TelefonieTabId>("overview");

  const renderTab = useCallback(() => {
    switch (tab) {
      case "overview":
        return <VoiceCallsDashboard />;
      case "mock":
        return <VoiceMockPanel />;
      case "active":
        return <VoiceHistoryPanel mode="active" />;
      case "history":
        return <VoiceHistoryPanel mode="past" />;
      case "voicemail":
        return (
          <div className="rounded-[16px] border border-dashed border-[var(--card-border)] bg-[var(--background-secondary)]/50 px-6 py-12 text-center text-[13px] text-[var(--text-secondary)]">
            Voicemail — noch keine Nachrichten. Wird über den Voice Core angebunden.
          </div>
        );
      case "transcripts":
        return <VoiceTranscriptsPanel />;
      case "memory":
        return <VoiceMemoryPanel />;
      case "provider":
        return <VoiceProviderPanel />;
      case "settings":
        return <VoiceSettingsPanel />;
      default:
        return null;
    }
  }, [tab]);

  return (
    <div className="mx-auto max-w-5xl px-8 py-12 lg:px-12 lg:py-14">
      <header className="mb-8">
        <p className="helpy-label">Voice Core</p>
        <h1 className="helpy-h1 mt-2">Helpy-Phone</h1>
        <p className="helpy-greeting-sub mt-3 max-w-2xl">
          KI-Telefonassistent mit Twilio — Anrufe entgegennehmen, verstehen und als Vorgänge
          vorbereiten.
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-[var(--card-border)] pb-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-colors duration-150",
              tab === item.id
                ? "bg-[var(--primary-light)] text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {renderTab()}
    </div>
  );
}
