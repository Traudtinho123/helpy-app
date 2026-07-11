"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { VoiceOverviewPanel } from "@/features/voice/components/voice-overview-panel";
import { VoiceCallsPanel } from "@/features/voice/components/voice-calls-panel";
import { VoiceStandardResponsesPanel } from "@/features/voice/components/voice-standard-responses-panel";
import { VoiceSettingsPanel } from "@/features/voice/components/voice-settings-panel";

export type TelefonieTabId = "overview" | "calls" | "responses" | "settings";

const TABS: { id: TelefonieTabId; label: string }[] = [
  { id: "overview", label: "Übersicht" },
  { id: "calls", label: "Gespräche" },
  { id: "responses", label: "Standard-Antworten" },
  { id: "settings", label: "Einstellungen" },
];

export function TelefoniePage() {
  const [tab, setTab] = useState<TelefonieTabId>("overview");

  const renderTab = useCallback(() => {
    switch (tab) {
      case "overview":
        return <VoiceOverviewPanel />;
      case "calls":
        return <VoiceCallsPanel />;
      case "responses":
        return <VoiceStandardResponsesPanel />;
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
