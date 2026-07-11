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
    const valid: VoiceCallClassification[] = [
      "besichtigung_anfrage",
      "info_anfrage",
      "rueckruf_wunsch",
      "notfall",
      "sonstiges",
    ];

    const intentRaw =
      (typeof parsed.intent === "string" && parsed.intent.trim()) ||
      (typeof parsed.classification === "string" && parsed.classification.trim()) ||
      null;

    let classification = intentRaw as VoiceCallClassification | undefined;
    if (parsed.dringend === true && classification !== "notfall") {
      classification = "notfall";
    }

    if (!classification || !valid.includes(classification)) {
      return null;
    }

    const termin =
      parsed.termin && typeof parsed.termin === "object"
        ? (parsed.termin as Record<string, unknown>)
        : null;

    const summaryHint =
      typeof parsed.zusammenfassung === "string" && parsed.zusammenfassung.trim()
        ? parsed.zusammenfassung.trim()
        : typeof parsed.summaryHint === "string" && parsed.summaryHint.trim()
          ? parsed.summaryHint.trim()
          : null;

    const terminDatum =
      (typeof termin?.datum === "string" && termin.datum.trim()) ||
      (typeof parsed.termin_datum === "string" && parsed.termin_datum.trim()) ||
      (typeof parsed.terminDatum === "string" && parsed.terminDatum.trim()) ||
      null;

    const terminUhrzeit =
      (typeof termin?.uhrzeit === "string" && termin.uhrzeit.trim()) ||
      (typeof parsed.termin_uhrzeit === "string" && parsed.termin_uhrzeit.trim()) ||
      (typeof parsed.terminUhrzeit === "string" && parsed.terminUhrzeit.trim()) ||
      null;

    const objekt =
      (typeof termin?.objekt === "string" && termin.objekt.trim()) ||
      (typeof parsed.objekt === "string" && parsed.objekt.trim()) ||
      null;

    const anruferName =
      typeof parsed.anrufer_name === "string" && parsed.anrufer_name.trim()
        ? parsed.anrufer_name.trim()
        : typeof parsed.anruferName === "string" && parsed.anruferName.trim()
          ? parsed.anruferName.trim()
          : null;

    const requestedDateTime =
      terminDatum && terminUhrzeit
        ? `${terminDatum} ${terminUhrzeit}`
        : typeof parsed.requestedDateTime === "string" && parsed.requestedDateTime.trim()
          ? parsed.requestedDateTime.trim()
          : null;

    return {
      classification,
      callerName:
        typeof parsed.callerName === "string" && parsed.callerName.trim()
          ? parsed.callerName.trim()
          : anruferName,
      objectReference:
        typeof parsed.objectReference === "string" && parsed.objectReference.trim()
          ? parsed.objectReference.trim()
          : objekt,
      requestedDateTime,
      createVorgang: parsed.createVorgang !== false,
      summaryHint,
      terminDatum,
      terminUhrzeit,
      terminDauerMinuten:
        typeof parsed.termin_dauer === "number" && parsed.termin_dauer > 0
          ? parsed.termin_dauer
          : typeof parsed.terminDauerMinuten === "number" && parsed.terminDauerMinuten > 0
            ? parsed.terminDauerMinuten
            : typeof parsed.terminDauer === "number" && parsed.terminDauer > 0
              ? parsed.terminDauer
              : null,
      objekt,
      objektAdresse:
        typeof parsed.objekt_adresse === "string" && parsed.objekt_adresse.trim()
          ? parsed.objekt_adresse.trim()
          : typeof parsed.objektAdresse === "string" && parsed.objektAdresse.trim()
            ? parsed.objektAdresse.trim()
            : null,
      anruferName,
      notizen:
        typeof parsed.notizen === "string" && parsed.notizen.trim()
          ? parsed.notizen.trim()
          : summaryHint,
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
      content: `Analysiere dieses Telefongespräch und extrahiere als JSON:
{
  "intent": "besichtigung_anfrage" | "info_anfrage" | "rueckruf_wunsch" | "notfall" | "sonstiges",
  "zusammenfassung": "2-3 Sätze auf Deutsch",
  "termin": {
    "datum": "YYYY-MM-DD oder null",
    "uhrzeit": "HH:MM oder null",
    "objekt": "Objektname oder null"
  },
  "anrufer_name": "Name oder null",
  "dringend": true/false
}
Antworte NUR mit dem JSON, kein Text davor/danach.

Regeln:
- besichtigung_anfrage: Besichtigung/Termin vereinbart oder gewünscht
- info_anfrage: Frage zu Objekt/Preis/Info ohne konkreten Termin
- rueckruf_wunsch: Rückruf/Mitarbeiter gewünscht
- notfall: dringend, Wasserschaden, Einbruch, sofort — oder dringend=true
- sonstiges: alles andere
- termin.datum/termin.uhrzeit: nur wenn im Gespräch genannt (ISO-Datum, 24h-Zeit)`,
    },
    {
      role: "user",
      content: `Firma: ${input.promptContext.companyName}\n\nTranskript:\n${input.transcript}`,
    },
  ];

  const raw = await callOpenAiChat(messages, {
    maxTokens: 400,
    temperature: 0.2,
    jsonMode: true,
  });

  console.log("[voice] GPT ANALYSIS RAW:", raw);

  const parsed = parseVoiceCallAnalysis(raw);
  console.log("[voice] GPT ANALYSIS PARSED:", parsed);

  return parsed;
}
