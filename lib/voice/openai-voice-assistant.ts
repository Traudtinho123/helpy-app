import type { VoiceCallClassification } from "@/features/voice/types/voice-types";
import type { VoiceTranscriptTurn } from "@/lib/voice/voice-call-session-store";
import type { VoiceCallPromptContext } from "@/lib/voice/voice-call-prompt-context";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

export type VoiceCallAnalysis = {
  classification: VoiceCallClassification;
  callerName: string | null;
  objectReference: string | null;
  requestedDateTime: string | null;
  createVorgang: boolean;
  summaryHint: string | null;
};

function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

function formatPortfolioBlock(
  objects: VoiceCallPromptContext["portfolioObjects"]
): string {
  if (objects.length === 0) {
    return "Keine Objekte in der Datenbank hinterlegt. Bei Objektfragen Rückruf anbieten.";
  }

  return objects
    .map((object, index) => {
      const parts = [
        `${index + 1}. ${object.titel}`,
        object.adresse ? object.adresse : null,
        object.ort ? object.ort : null,
        object.zimmer ? `${object.zimmer} Zimmer` : null,
        object.preis ? `Preis: ${object.preis}` : null,
      ].filter(Boolean);
      return `- ${parts.join(", ")}`;
    })
    .join("\n");
}

function formatStandardResponsesBlock(
  responses: VoiceCallPromptContext["standardResponses"]
): string {
  if (responses.length === 0) {
    return "Keine Standard-Antworten hinterlegt.";
  }

  return responses
    .map(
      (item) =>
        `- Wenn jemand nach «${item.triggerText}» fragt, antworte: «${item.responseText}»`
    )
    .join("\n");
}

export function buildHelpyPhoneSystemPrompt(context: VoiceCallPromptContext): string {
  return `1. ROLLE & PERSÖNLICHKEIT
Du bist HELPY, der KI-Telefonassistent von ${context.companyName}.
Freundlich, professionell, auf Deutsch (Hochdeutsch).

2. FIRMENWISSEN
${context.systemContext}

3. STANDARD-ANTWORTEN
${formatStandardResponsesBlock(context.standardResponses)}

4. VERFÜGBARE OBJEKTE (max. 5, nur diese Infos nennen)
${formatPortfolioBlock(context.portfolioObjects)}

5. ENTSCHEIDUNGSREGELN
Fall A — Standard-Antwort passt (Trigger/Thema erkannt):
→ Nutze die hinterlegte Standard-Antwort wörtlich oder sinngemäss.
→ Frage danach: "Kann ich Ihnen noch anderweitig helfen?"

Fall B — Objekt-/Immobilien-Anfrage:
→ Suche in den verfügbaren Objekten nach passenden Infos (Adresse, Zimmer, Preis).
→ Gib nur bekannte Infos weiter. Nichts erfinden.
→ Frage ob ein Besichtigungstermin gewünscht ist.

Fall C — Besichtigungstermin:
→ Frage: "Für welches Objekt interessieren Sie sich?"
→ Frage: "Wann würde es Ihnen passen?" (Datum/Uhrzeit)
→ Bestätige: "Ich habe Ihren Terminwunsch notiert. Jemand aus unserem Team meldet sich zur Bestätigung."

Fall D — Unbekannte/spezielle Anfrage:
→ Sage: "Das ist eine sehr gute Frage. Ich notiere Ihr Anliegen und ein Mitarbeiter meldet sich so schnell wie möglich bei Ihnen zurück."
→ Frage nach dem Namen, falls unbekannt.

Fall E — Dringend/Notfall (Keywords: dringend, Notfall, sofort, Wasserschaden, Einbruch, Leck, Brand):
→ Sage: "Ich verstehe, das ist dringend. Ich leite Ihren Anruf als Notfall weiter und jemand meldet sich umgehend bei Ihnen."

6. ANTWORT-REGELN
- Max. 2-3 Sätze pro Antwort
- Niemals erfundene Infos
- Bei Unsicherheit: Rückruf anbieten
- Immer höflich
- Nur gesprochener Fliesstext, kein Markdown`;
}

function turnsToMessages(turns: VoiceTranscriptTurn[]) {
  return turns.map((turn) => ({
    role: turn.role === "caller" ? ("user" as const) : ("assistant" as const),
    content: turn.text,
  }));
}

async function callOpenAiChat(
  messages: Array<{ role: string; content: string }>,
  options?: { maxTokens?: number; temperature?: number; jsonMode?: boolean }
): Promise<string | null> {
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
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 180,
        ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
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
  promptContext: VoiceCallPromptContext;
  priorTurns: VoiceTranscriptTurn[];
  callerMessage: string;
}): Promise<string> {
  const fallback =
    "Vielen Dank für Ihre Nachricht. Ich habe Ihr Anliegen notiert und unser Team meldet sich bei Ihnen.";

  const messages = [
    { role: "system", content: buildHelpyPhoneSystemPrompt(input.promptContext) },
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

  const summary = await callOpenAiChat(messages, { maxTokens: 120 });
  return summary?.slice(0, 280) ?? fallback;
}

function parseVoiceCallAnalysis(raw: string | null): VoiceCallAnalysis | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<VoiceCallAnalysis>;
    const classification = parsed.classification;
    const valid: VoiceCallClassification[] = [
      "besichtigung_anfrage",
      "info_anfrage",
      "rueckruf_wunsch",
      "notfall",
      "sonstiges",
    ];

    if (!classification || !valid.includes(classification)) {
      return null;
    }

    return {
      classification,
      callerName:
        typeof parsed.callerName === "string" && parsed.callerName.trim()
          ? parsed.callerName.trim()
          : null,
      objectReference:
        typeof parsed.objectReference === "string" && parsed.objectReference.trim()
          ? parsed.objectReference.trim()
          : null,
      requestedDateTime:
        typeof parsed.requestedDateTime === "string" && parsed.requestedDateTime.trim()
          ? parsed.requestedDateTime.trim()
          : null,
      createVorgang: parsed.createVorgang !== false,
      summaryHint:
        typeof parsed.summaryHint === "string" && parsed.summaryHint.trim()
          ? parsed.summaryHint.trim()
          : null,
    };
  } catch {
    return null;
  }
}

export async function analyzeVoiceCallTranscript(input: {
  promptContext: VoiceCallPromptContext;
  transcript: string;
}): Promise<VoiceCallAnalysis | null> {
  const messages = [
    {
      role: "system",
      content: `Analysiere das Telefonat und antworte NUR als JSON:
{
  "classification": "besichtigung_anfrage|info_anfrage|rueckruf_wunsch|notfall|sonstiges",
  "callerName": string|null,
  "objectReference": string|null,
  "requestedDateTime": string|null,
  "createVorgang": boolean,
  "summaryHint": string|null
}

Regeln:
- besichtigung_anfrage: Termin/Besichtigung vereinbaren
- info_anfrage: Frage zu Objekt/Preis/Info
- rueckruf_wunsch: Rückruf/Mitarbeiter gewünscht
- notfall: dringend, Wasserschaden, Einbruch, sofort
- sonstiges: alles andere
- createVorgang: true bei besichtigung_anfrage, rueckruf_wunsch, notfall; bei info_anfrage wenn Follow-up nötig; sonstiges wenn Anliegen offen`,
    },
    {
      role: "user",
      content: `Firma: ${input.promptContext.companyName}\n\nTranskript:\n${input.transcript}`,
    },
  ];

  const raw = await callOpenAiChat(messages, {
    maxTokens: 220,
    temperature: 0.2,
    jsonMode: true,
  });

  return parseVoiceCallAnalysis(raw);
}
