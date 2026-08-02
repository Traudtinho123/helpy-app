import { hasCustomerInquirySignals } from "@/features/spam-handling/services/spam-detection";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

export type MailVorgangCategory =
  | "immobilien_anfrage"
  | "allgemeine_anfrage"
  | "system_mail"
  | "verifizierung"
  | "newsletter"
  | "spam"
  | "antwort_auf_eigene_mail";

export type MailVorgangClassification = {
  ist_vorgang: boolean;
  grund: string;
  kategorie: MailVorgangCategory;
  absender_typ: "privat_person" | "unternehmen" | "system" | "unbekannt";
};

export type MailClassificationInput = {
  messageId: string;
  from: string;
  subject: string;
  bodyPreview: string;
};

function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function isMailVorgangClassifierConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

const CLASSIFICATION_SYSTEM_PROMPT = `Du klassifizierst eingehende E-Mails für ein Immobilien-/Dienstleistungs-CRM.
Antworte NUR mit validem JSON im Format:
{
  "results": [
    {
      "messageId": "id",
      "ist_vorgang": true,
      "grund": "kurze Begründung",
      "kategorie": "immobilien_anfrage|allgemeine_anfrage|system_mail|verifizierung|newsletter|spam|antwort_auf_eigene_mail",
      "absender_typ": "privat_person|unternehmen|system|unbekannt"
    }
  ]
}

Regeln:
- System-Mails (noreply, codes, Bestätigungen, DocuSign, Stripe, Google Accounts): ist_vorgang = false
- Newsletter/Marketing: ist_vorgang = false
- Echte Anfragen von Personen: ist_vorgang = true
- Im Zweifel: ist_vorgang = false`;

function buildClassificationUserPrompt(inputs: MailClassificationInput[]): string {
  const blocks = inputs.map(
    (input) =>
      `messageId: ${input.messageId}
Mail-From: ${input.from}
Mail-Subject: ${input.subject}
Mail-Body (erste 200 Zeichen): ${input.bodyPreview.slice(0, 200)}`
  );

  return blocks.join("\n\n---\n\n");
}

function parseClassificationPayload(
  raw: string | null,
  inputs: MailClassificationInput[]
): Map<string, MailVorgangClassification> {
  const fallback = new Map<string, MailVorgangClassification>();

  for (const input of inputs) {
    const combined = `${input.subject} ${input.from} ${input.bodyPreview}`.toLowerCase();
    const likelyCustomer = hasCustomerInquirySignals(combined);
    fallback.set(input.messageId, {
      ist_vorgang: likelyCustomer,
      grund: likelyCustomer
        ? "Heuristische Kundenanfrage erkannt"
        : "Im Zweifel kein Vorgang (Fallback ohne KI)",
      kategorie: likelyCustomer ? "allgemeine_anfrage" : "system_mail",
      absender_typ: "unbekannt",
    });
  }

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as {
      results?: Array<
        MailVorgangClassification & {
          messageId?: string;
        }
      >;
    };

    for (const result of parsed.results ?? []) {
      if (!result.messageId) continue;
      fallback.set(result.messageId, {
        ist_vorgang: Boolean(result.ist_vorgang),
        grund: result.grund?.trim() || "KI-Klassifikation",
        kategorie: result.kategorie ?? "system_mail",
        absender_typ: result.absender_typ ?? "unbekannt",
      });
    }
  } catch {
    // Fallback bleibt aktiv
  }

  return fallback;
}

/** Server-seitige GPT-4o Klassifikation vor Vorgang-Erstellung. */
export async function classifyMailsForVorgangServer(
  inputs: MailClassificationInput[]
): Promise<Map<string, MailVorgangClassification>> {
  if (inputs.length === 0) {
    return new Map();
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return parseClassificationPayload(null, inputs);
  }

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
          { role: "user", content: buildClassificationUserPrompt(inputs) },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[mail-classifier] OpenAI failed:", response.status);
      return parseClassificationPayload(null, inputs);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content?.trim() ?? null;
    return parseClassificationPayload(content, inputs);
  } catch (error) {
    console.error(
      "[mail-classifier] OpenAI error:",
      error instanceof Error ? error.message : "unknown"
    );
    return parseClassificationPayload(null, inputs);
  }
}

/** Client-Hilfe: ruft Klassifikations-API auf. */
export async function classifyMailsForVorgangClient(
  inputs: MailClassificationInput[]
): Promise<Map<string, MailVorgangClassification>> {
  if (inputs.length === 0) {
    return new Map();
  }

  try {
    const response = await fetch("/api/mail/classify-vorgang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: inputs }),
    });

    if (!response.ok) {
      return parseClassificationPayload(null, inputs);
    }

    const payload = (await response.json()) as {
      results?: Array<MailVorgangClassification & { messageId: string }>;
    };

    const mapped = new Map<string, MailVorgangClassification>();
    for (const result of payload.results ?? []) {
      mapped.set(result.messageId, {
        ist_vorgang: Boolean(result.ist_vorgang),
        grund: result.grund,
        kategorie: result.kategorie,
        absender_typ: result.absender_typ,
      });
    }

    if (mapped.size === 0) {
      return parseClassificationPayload(null, inputs);
    }

    return mapped;
  } catch {
    return parseClassificationPayload(null, inputs);
  }
}
