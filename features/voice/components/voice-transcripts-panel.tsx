"use client";

import { getAllConversationSessions } from "@/features/voice/voice-history";

export function VoiceTranscriptsPanel() {
  const sessions = getAllConversationSessions().filter((s) => s.transcript);

  if (sessions.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-12 text-center text-[13px] text-[#64748B]">
        Noch keine Transkripte.
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
          <p className="text-[12px] font-semibold text-[#0F172A]">
            {new Date(session.startedAt).toLocaleString("de-CH")} · {session.providerId}
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-[#475569]">
            {session.transcript}
          </pre>
        </article>
      ))}
    </div>
  );
}
