"use client";

import { useEffect, useMemo, useState } from "react";
import { loadDebugGmailMessages } from "@/app/debug/gmail/actions";
import { analyzeGmailMessages } from "@/features/brain/services/brain-v3";
import type { BrainV3Result } from "@/features/brain/types/brain-v3-types";
import { formatGmailDateTime } from "@/features/gmail/services/gmail-date-format";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import { createClient } from "@/lib/supabase/client";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";
import { DEFAULT_HELPY_SKILL } from "@/features/workspace/services/workspace/skills";

const PRIORITY_LABELS: Record<BrainV3Result["priority"], string> = {
  kritisch: "Kritisch",
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

export default function DebugGmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<GmailConnectorMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const activeSkill = useMemo(() => {
    try {
      return getCompanyProfileSnapshot().activePaidSkill ?? DEFAULT_HELPY_SKILL;
    } catch {
      return DEFAULT_HELPY_SKILL;
    }
  }, []);

  const brainResults = useMemo(
    () => analyzeGmailMessages(messages, { activeSkill }),
    [messages, activeSkill]
  );

  const brainByEmailId = useMemo(
    () => new Map(brainResults.map((result) => [result.originalEmailId, result])),
    [brainResults]
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setLoaded(true);
      return;
    }

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      setEmail(session?.user?.email ?? null);

      const providerToken = session?.provider_token;
      if (!providerToken) {
        setNotConnected(true);
        setLoaded(true);
        return;
      }

      const result = await loadDebugGmailMessages(providerToken);
      if (result.ok) {
        setMessages(result.messages);
      } else {
        setError(result.error);
      }
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <main style={{ padding: 24, fontFamily: "monospace" }}>
        Lade Gmail…
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace", lineHeight: 1.8 }}>
      <h1>/debug/gmail</h1>
      <p>Entwickler-Debug — Gmail Connector v1 · Brain v3</p>
      <p>User: {email ?? "—"}</p>
      <hr />

      {notConnected && <p>Nicht mit Google verbunden</p>}

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!notConnected && !error && messages.length === 0 && (
        <p>Keine Nachrichten gefunden.</p>
      )}

      {!notConnected && !error && messages.length > 0 && (
        <ol style={{ paddingLeft: 20 }}>
          {messages.map((message) => {
            const brain = brainByEmailId.get(message.id);

            return (
              <li key={message.id} style={{ marginBottom: 24 }}>
                <p>
                  <strong>{message.subject}</strong>
                </p>
                <p>Von: {message.from}</p>
                <p>Datum: {formatGmailDateTime(message.date)}</p>
                <p>Snippet: {message.snippet || "—"}</p>
                <p>
                  ID: {message.id} · Thread: {message.threadId}
                </p>

                {brain && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      background: "#f8fafc",
                    }}
                  >
                    <p>
                      <strong>HELPY erkennt:</strong>
                    </p>
                    <p>Skill: {brain.skill}</p>
                    <p>Intent: {brain.intent}</p>
                    <p>Priorität: {PRIORITY_LABELS[brain.priority]}</p>
                    <p>Zusammenfassung: {brain.summary}</p>
                    <p>Empfehlung: {brain.recommendedAction}</p>
                    <p>Status: {brain.status}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
