"use client";

import { useState } from "react";
import { getVoiceMemoryRecords, searchVoiceMemory } from "@/features/voice/voice-memory";

export function VoiceMemoryPanel() {
  const [query, setQuery] = useState("");
  const records = query.trim() ? searchVoiceMemory(query) : getVoiceMemoryRecords();

  return (
    <div className="space-y-4">
      <input
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[13px]"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Memory durchsuchen …"
      />

      {records.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-12 text-center text-[13px] text-[var(--text-secondary)]">
          Noch kein Voice Memory. Starte ein Mock-Gespräch.
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <article
              key={record.memoryId}
              className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                  {record.intentLabel} · {record.sentiment}
                </p>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {new Date(record.createdAt).toLocaleString("de-CH")}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{record.summary}</p>
              <div className="mt-2 grid gap-1 text-[11px] text-[var(--text-muted)] sm:grid-cols-2">
                <span>Nächster Schritt: {record.nextStep}</span>
                <span>Objekte: {record.discussedObjects.join(", ") || "—"}</span>
                <span>Termine: {record.appointments.join(", ") || "—"}</span>
                <span>Fragen: {record.questions.length}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
