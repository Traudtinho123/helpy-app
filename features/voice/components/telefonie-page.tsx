"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { VoiceMockPanel } from "@/features/voice/components/voice-mock-panel";
import { VoiceHistoryPanel } from "@/features/voice/components/voice-history-panel";
import { VoiceMemoryPanel } from "@/features/voice/components/voice-memory-panel";
import { VoiceProviderPanel } from "@/features/voice/components/voice-provider-panel";
import { VoiceSettingsPanel } from "@/features/voice/components/voice-settings-panel";
import { VoiceTranscriptsPanel } from "@/features/voice/components/voice-transcripts-panel";

export type TelefonieTabId =
  | "mock"
  | "active"
  | "history"
  | "voicemail"
  | "transcripts"
  | "memory"
  | "provider"
  | "settings";

const TABS: { id: TelefonieTabId; label: string }[] = [
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
  const [tab, setTab] = useState<TelefonieTabId>("mock");

  const renderTab = useCallback(() => {
    switch (tab) {
      case "mock":
        return <VoiceMockPanel />;
      case "active":
        return <VoiceHistoryPanel mode="active" />;
      case "history":
        return <VoiceHistoryPanel mode="past" />;
      case "voicemail":
        return (
          <div className="rounded-[16px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-12 text-center text-[13px] text-[#64748B]">
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
        <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
          Voice Core
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.035em] text-[#0F172A] lg:text-[2.25rem]">
          Helpy-Phone
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#64748B]">
          KI-Telefonie mit HELPY — providerunabhängig. Mock-Modus für Entwicklung und Tests.
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors",
              tab === item.id
                ? "bg-[#2563EB] text-white"
                : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
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
