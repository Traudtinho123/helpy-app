import { buildCompanyKnowledgeContextLines } from "@/features/company-knowledge/services/company-knowledge-context";
import { buildReplyDraftCompanyContext } from "@/features/reply-drafts/services/reply-draft-company-knowledge";
import type {
  HelpyChatContext,
  HelpyChatRequest,
  HelpyChatResponse,
} from "@/features/helpy-chat/types/helpy-chat-types";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export const HELPY_CHAT_SYSTEM_PROMPT = `Du bist HELPY, der KI-Bürokollege in einer Schweizer Büro-Software.
Antworte auf Deutsch, kurz und konkret (max. 120 Wörter).
Du bereitest Arbeit vor — der Mensch prüft und bestätigt immer selbst.
Keine erfundenen Fakten. Wenn dir Kontext fehlt, sag das ehrlich.
Keine mehrfachen Begrüssungen. Keine Signatur am Ende.`;

function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function isHelpyChatGptConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

function buildContextBlock(context?: HelpyChatContext): string {
  if (!context) return "Kein zusätzlicher Kontext.";

  const lines = [`Oberfläche: ${context.surface}`];
  if (context.skill) lines.push(`Skill: ${context.skill}`);
  if (context.vorgangTitle) lines.push(`Vorgang: ${context.vorgangTitle}`);
  if (context.vorgangId) lines.push(`Vorgang-ID: ${context.vorgangId}`);
  if (context.vorgangSummary) lines.push(`Zusammenfassung: ${context.vorgangSummary}`);
  if (context.workdayHint) lines.push(`Arbeitstag: ${context.workdayHint}`);
  return lines.join("\n");
}

function buildLocalHelpyReply(
  message: string,
  context?: HelpyChatContext
): string {
  const text = message.trim().toLowerCase();

  if (/posteingang|e-mail|email|mail/.test(text)) {
    return "Ich kann deinen Posteingang zusammenfassen und daraus Vorgänge vorbereiten. Öffne den Posteingang oder starte auf dem Dashboard — dort siehst du, was HELPY bereits erkannt hat.";
  }

  if (/kalender|termin|besichtigung/.test(text)) {
    return "Für Termine prüfe ich deinen Kalender und schlage passende Fenster vor. Geh zu Kalender — dort siehst du heutige Termine und HELPY-Vorschläge für freie Zeit.";
  }

  if (/angebot|offerte/.test(text)) {
    return "Bei Angeboten bereite ich Entwürfe und Qualitätsprüfungen vor. Wähle ein Angebot unter Angebote — ich zeige dir fehlende Angaben und den nächsten Schritt zur Freigabe.";
  }

  if (/vorgang|workspace|fall/.test(text) && context?.vorgangTitle) {
    return `Zu „${context.vorgangTitle}“: Ich habe den Vorgang vorbereitet. Nutze „Vorbereitung prüfen“ im Panel — dort siehst du Antwortentwürfe, Termine und meine Empfehlung. Du entscheidest, was ausgeführt wird.`;
  }

  if (/was kannst|hilf|help|was machst/.test(text)) {
    return "Ich sortiere Eingänge, bereite Vorgänge vor, schlage Antworten und Termine vor und halte den Überblick. Frag mich z. B. nach Posteingang, Kalender, Angeboten oder einem konkreten Vorgang.";
  }

  if (context?.surface === "workspace" && context.vorgangSummary) {
    return `Kurz zum Vorgang: ${context.vorgangSummary.slice(0, 280)} — Soll ich dir den nächsten Prüfschritt nennen oder eine Antwort skizzieren?`;
  }

  return "Verstanden. Ich bereite das für dich vor — schau in die Vorgänge oder den Posteingang, dort findest du meine konkreten Vorschläge zum Prüfen.";
}

async function callHelpyChatGpt(input: HelpyChatRequest): Promise<string | null> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) return null;

  const profile = getCompanyProfileSnapshot();
  const companyContext = buildReplyDraftCompanyContext(profile);
  const companyLines = buildCompanyKnowledgeContextLines(profile);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> =
    [
      {
        role: "system",
        content: `${HELPY_CHAT_SYSTEM_PROMPT}\n\nFirma: ${companyContext.companyName}\n${companyLines.join("\n")}\n\nKontext:\n${buildContextBlock(input.context)}`,
      },
    ];

  for (const entry of input.history ?? []) {
    messages.push({ role: entry.role, content: entry.content });
  }

  messages.push({ role: "user", content: input.message });

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
        max_tokens: 350,
        messages,
      }),
    });

    if (!response.ok) {
      console.error("[helpy-chat] OpenAI failed:", response.status);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch (error) {
    console.error(
      "[helpy-chat] OpenAI error:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

export async function generateHelpyChatReply(
  input: HelpyChatRequest
): Promise<HelpyChatResponse> {
  const gptReply = await callHelpyChatGpt(input);
  if (gptReply) {
    return { reply: gptReply, source: "gpt" };
  }

  return {
    reply: buildLocalHelpyReply(input.message, input.context),
    source: "local",
  };
}
