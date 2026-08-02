"use client";

import { getAllConversationSessions } from "@/features/voice/voice-history";

export function VoiceTranscriptsPanel() {
  const sessions = getAllConversationSessions().filter((s) => s.transcript);

  if (sessions.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-12 text-center text-[13px] text-[var(--text-secondary)]">
        Noch keine Transkripte.
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
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">
            {new Date(session.startedAt).toLocaleString("de-CH")} · {session.providerId}
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--text-muted)]">
            {session.transcript}
          </pre>
        </article>
      ))}
    </div>
  );
}
