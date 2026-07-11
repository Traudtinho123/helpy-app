import type { VoiceTranscriptTurn } from "@/lib/voice/voice-call-session-store";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

function buildHelpyPhoneSystemPrompt(systemContext: string): string {
  return `Du bist HELPY, der KI-Telefonassistent des Unternehmens.
Du nimmst Anrufe entgegen und hilfst Anrufern professionell und freundlich.

Firmeninfos:
${systemContext}

Deine Aufgaben am Telefon:
- Besichtigungstermine anfragen und vormerken
- Allgemeine Fragen zu Objekten und Dienstleistungen beantworten
- Rückruf-Wünsche aufnehmen
- Dringendes klar anerkennen und weiterleiten

Wichtige Regeln:
- Antworte IMMER auf Deutsch (Schweizerdeutsch-freundlich, aber Hochdeutsch)
- Halte Antworten kurz (max. 2-3 Sätze) — am Telefon will niemand lange Texte hören
- Sei freundlich aber professionell
- Falls du etwas nicht weisst: "Ich notiere Ihre Anfrage und jemand meldet sich bei Ihnen."
- NIEMALS erfundene Infos nennen
- Keine Markdown-Formatierung, nur gesprochener Fliesstext`;
}

function turnsToMessages(turns: VoiceTranscriptTurn[]) {
  return turns.map((turn) => ({
    role: turn.role === "caller" ? ("user" as const) : ("assistant" as const),
    content: turn.text,
  }));
}

async function callOpenAiChat(messages: Array<{ role: string; content: string }>): Promise<string | null> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 180,
        messages,
      }),
    });

    if (!response.ok) {
      console.error("[voice] OpenAI chat failed:", response.status);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch (error) {
    console.error(
      "[voice] OpenAI request error:",
      error instanceof Error ? error.message : "unknown"
    );
    return null;
  }
}

export async function generateHelpyPhoneReply(input: {
  systemContext: string;
  priorTurns: VoiceTranscriptTurn[];
  callerMessage: string;
}): Promise<string> {
  const fallback =
    "Vielen Dank für Ihre Nachricht. Ich habe Ihr Anliegen notiert und unser Team meldet sich bei Ihnen.";

  const messages = [
    { role: "system", content: buildHelpyPhoneSystemPrompt(input.systemContext) },
    ...turnsToMessages(input.priorTurns),
    { role: "user", content: input.callerMessage },
  ];

  const reply = await callOpenAiChat(messages);
  if (!reply) return fallback;

  return reply.replace(/\s+/g, " ").trim().slice(0, 900);
}

export async function generateHelpyCallSummary(input: {
  systemContext: string;
  transcript: string;
}): Promise<string> {
  const fallback = input.transcript.slice(0, 200).trim() || "Telefonat ohne Transkript.";

  const messages = [
    {
      role: "system",
      content:
        "Fasse das Telefonat in einem kurzen deutschen Satz (max. 25 Wörter) zusammen. Nur die Zusammenfassung, nichts anderes.",
    },
    {
      role: "user",
      content: `Kontext:\n${input.systemContext}\n\nTranskript:\n${input.transcript}`,
    },
  ];

  const summary = await callOpenAiChat(messages);
  return summary?.slice(0, 280) ?? fallback;
}
