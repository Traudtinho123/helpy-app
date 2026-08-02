"use client";

import { getActiveConversations, getPastConversations } from "@/features/voice/voice-history";

type VoiceHistoryPanelProps = {
  mode: "active" | "past";
};

export function VoiceHistoryPanel({ mode }: VoiceHistoryPanelProps) {
  const sessions = mode === "active" ? getActiveConversations() : getPastConversations();

  if (sessions.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-12 text-center text-[13px] text-[var(--text-secondary)]">
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
          className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              {session.intent ?? "Gespräch"} · {session.skill}
            </p>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {new Date(session.startedAt).toLocaleString("de-CH")}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] text-[var(--text-secondary)]">
            {session.summary ?? session.transcript ?? "—"}
          </p>
          {session.vorgangId && (
            <a
              href={`/workspace/${session.vorgangId}`}
              className="mt-2 inline-block text-[11px] font-semibold text-[var(--accent)] underline"
            >
              Vorgang öffnen
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
