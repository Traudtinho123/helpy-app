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
  terminDatum: string | null;
  terminUhrzeit: string | null;
  terminDauerMinuten: number | null;
  objekt: string | null;
  objektAdresse: string | null;
  anruferName: string | null;
  notizen: string | null;
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
- Nur gesprochener Fliesstext, kein Markdown
- Frage NICHT am Ende jeder Antwort "Kann ich noch etwas für Sie tun?" oder ähnliche Nachfragen — antworte nur auf das Anliegen`;
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
        "Fasse dieses Telefongespräch in 2-3 Sätzen zusammen. Erwähne: Anliegen, ob ein Termin vereinbart wurde, ob ein Rückruf gewünscht wurde. Antworte auf Deutsch. Nur die Zusammenfassung, nichts anderes.",
    },
    {
      role: "user",
      content: `Kontext:\n${input.systemContext}\n\nTranskript:\n${input.transcript}`,
    },
  ];

  const summary = await callOpenAiChat(messages, { maxTokens: 220 });
  return summary?.slice(0, 480) ?? fallback;
}

function parseVoiceCallAnalysis(raw: string | null): VoiceCallAnalysis | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const classification = parsed.classification as VoiceCallClassification | undefined;
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
      terminDatum:
        typeof parsed.termin_datum === "string" && parsed.termin_datum.trim()
          ? parsed.termin_datum.trim()
          : typeof parsed.terminDatum === "string" && parsed.terminDatum.trim()
            ? parsed.terminDatum.trim()
            : null,
      terminUhrzeit:
        typeof parsed.termin_uhrzeit === "string" && parsed.termin_uhrzeit.trim()
          ? parsed.termin_uhrzeit.trim()
          : typeof parsed.terminUhrzeit === "string" && parsed.terminUhrzeit.trim()
            ? parsed.terminUhrzeit.trim()
            : null,
      terminDauerMinuten:
        typeof parsed.termin_dauer === "number" && parsed.termin_dauer > 0
          ? parsed.termin_dauer
          : typeof parsed.terminDauerMinuten === "number" && parsed.terminDauerMinuten > 0
            ? parsed.terminDauerMinuten
            : typeof parsed.terminDauer === "number" && parsed.terminDauer > 0
              ? parsed.terminDauer
              : null,
      objekt:
        typeof parsed.objekt === "string" && parsed.objekt.trim()
          ? parsed.objekt.trim()
          : null,
      objektAdresse:
        typeof parsed.objekt_adresse === "string" && parsed.objekt_adresse.trim()
          ? parsed.objekt_adresse.trim()
          : typeof parsed.objektAdresse === "string" && parsed.objektAdresse.trim()
            ? parsed.objektAdresse.trim()
            : null,
      anruferName:
        typeof parsed.anrufer_name === "string" && parsed.anrufer_name.trim()
          ? parsed.anrufer_name.trim()
          : typeof parsed.anruferName === "string" && parsed.anruferName.trim()
            ? parsed.anruferName.trim()
            : null,
      notizen:
        typeof parsed.notizen === "string" && parsed.notizen.trim()
          ? parsed.notizen.trim()
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
  "summaryHint": string|null,
  "termin_datum": "YYYY-MM-DD"|null,
  "termin_uhrzeit": "HH:MM"|null,
  "termin_dauer": number|null,
  "objekt": string|null,
  "objekt_adresse": string|null,
  "anrufer_name": string|null,
  "notizen": string|null
}

Regeln:
- besichtigung_anfrage: Termin/Besichtigung vereinbaren
- info_anfrage: Frage zu Objekt/Preis/Info
- rueckruf_wunsch: Rückruf/Mitarbeiter gewünscht (auch mit Terminwunsch)
- notfall: dringend, Wasserschaden, Einbruch, sofort
- sonstiges: alles andere
- termin_datum/termin_uhrzeit: nur setzen wenn im Gespräch genannt (ISO-Datum, 24h-Zeit)
- termin_dauer: Minuten falls erkennbar, sonst null
- notizen: 1 kurzer Satz zum Anliegen
- createVorgang: true bei besichtigung_anfrage, rueckruf_wunsch, notfall; bei info_anfrage wenn Follow-up nötig; sonstiges wenn Anliegen offen`,
    },
    {
      role: "user",
      content: `Firma: ${input.promptContext.companyName}\n\nTranskript:\n${input.transcript}`,
    },
  ];

  const raw = await callOpenAiChat(messages, {
    maxTokens: 320,
    temperature: 0.2,
    jsonMode: true,
  });

  return parseVoiceCallAnalysis(raw);
}
