"use client";

import { getActiveConversations, getPastConversations } from "@/features/voice/voice-history";

type VoiceHistoryPanelProps = {
  mode: "active" | "past";
};

export function VoiceHistoryPanel({ mode }: VoiceHistoryPanelProps) {
  const sessions = mode === "active" ? getActiveConversations() : getPastConversations();

  if (sessions.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-12 text-center text-[13px] text-[#64748B]">
        {mode === "active"
          ? "Keine aktiven Gespräche."
          : "Noch keine vergangenen Gespräche."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <article
          key={session.conversationId}
          className="rounded-[16px] border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-[#0F172A]">
              {session.intent ?? "Gespräch"} · {session.skill}
            </p>
            <span className="text-[11px] text-[#64748B]">
              {new Date(session.startedAt).toLocaleString("de-CH")}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] text-[#64748B]">
            {session.summary ?? session.transcript ?? "—"}
          </p>
          {session.vorgangId && (
            <a
              href={`/workspace/${session.vorgangId}`}
              className="mt-2 inline-block text-[11px] font-semibold text-[#2563EB] underline"
            >
              Vorgang öffnen
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
