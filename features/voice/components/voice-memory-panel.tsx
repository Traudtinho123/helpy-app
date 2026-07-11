"use client";

import { useState } from "react";
import { getVoiceMemoryRecords, searchVoiceMemory } from "@/features/voice/voice-memory";

export function VoiceMemoryPanel() {
  const [query, setQuery] = useState("");
  const records = query.trim() ? searchVoiceMemory(query) : getVoiceMemoryRecords();

  return (
    <div className="space-y-4">
      <input
        className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px]"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Memory durchsuchen …"
      />

      {records.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-12 text-center text-[13px] text-[#64748B]">
          Noch kein Voice Memory. Starte ein Mock-Gespräch.
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <article
              key={record.memoryId}
              className="rounded-[16px] border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-[#0F172A]">
                  {record.intentLabel} · {record.sentiment}
                </p>
                <span className="text-[11px] text-[#64748B]">
                  {new Date(record.createdAt).toLocaleString("de-CH")}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#64748B]">{record.summary}</p>
              <div className="mt-2 grid gap-1 text-[11px] text-[#475569] sm:grid-cols-2">
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
