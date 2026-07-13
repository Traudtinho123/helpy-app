const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

import {
  buildReplyGenerationUserPrompt,
  REPLY_GENERATION_SYSTEM_PROMPT,
} from "@/features/reply-drafts/services/reply-generation-prompt";
import { buildVariantsFromSingleDraft } from "@/features/reply-drafts/services/reply-quality-check";
import type {
  GeneratedReplyVariants,
  MailAnalysisExtraction,
  ReplyGenerationContext,
} from "@/features/reply-drafts/types/mail-analysis-types";
import { MAIL_ANALYSIS_EXTRACTION_PROMPT } from "@/features/reply-drafts/services/mail-analysis-extraction";

function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function isReplyGptConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

async function callOpenAiChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
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
        temperature: options?.temperature ?? 0.35,
        max_tokens: options?.maxTokens ?? 700,
        ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages,
      }),
    });

    if (!response.ok) {
      console.error("[reply-draft] OpenAI failed:", response.status);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return payload.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error(
      "[reply-draft] OpenAI error:",
      error instanceof Error ? error.message : "unknown"
    );
    return null;
  }
}

function parseJsonObject<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    const fenced = raw.match(/```json\s*([\s\S]*?)```/i)?.[1]?.trim();
    if (!fenced) return null;
    try {
      return JSON.parse(fenced) as T;
    } catch {
      return null;
    }
  }
}

export async function refineMailAnalysisWithGpt(input: {
  from: string;
  subject: string;
  body: string;
  baseline: MailAnalysisExtraction;
}): Promise<MailAnalysisExtraction> {
  const raw = await callOpenAiChat(
    [
      { role: "system", content: MAIL_ANALYSIS_EXTRACTION_PROMPT },
      {
        role: "user",
        content: `Absender: ${input.from}\nBetreff: ${input.subject}\n\n${input.body}`,
      },
    ],
    { maxTokens: 500, jsonMode: true }
  );

  const parsed = parseJsonObject<MailAnalysisExtraction>(raw);
  if (!parsed) return input.baseline;

  return {
    ...input.baseline,
    ...parsed,
    konkrete_fragen:
      parsed.konkrete_fragen?.length > 0
        ? parsed.konkrete_fragen
        : input.baseline.konkrete_fragen,
    genannte_objekte:
      parsed.genannte_objekte?.length > 0
        ? parsed.genannte_objekte
        : input.baseline.genannte_objekte,
  };
}

export async function generateReplyVariantsWithGpt(
  context: ReplyGenerationContext
): Promise<GeneratedReplyVariants | null> {
  const raw = await callOpenAiChat(
    [
      { role: "system", content: REPLY_GENERATION_SYSTEM_PROMPT },
      { role: "user", content: buildReplyGenerationUserPrompt(context) },
    ],
    { maxTokens: 900, jsonMode: true }
  );

  const parsed = parseJsonObject<{ short?: string; detailed?: string }>(raw);
  if (parsed?.short && parsed?.detailed) {
    return {
      short: parsed.short.trim(),
      detailed: parsed.detailed.trim(),
    };
  }

  if (raw && !parsed) {
    const fallback = buildVariantsFromSingleDraft(raw, context.analysis);
    return fallback;
  }

  return null;
}
