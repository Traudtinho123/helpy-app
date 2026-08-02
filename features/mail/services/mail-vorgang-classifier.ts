const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

/** @deprecated Legacy alias — nutze VorgangMailCategory */
export type MailVorgangCategory =
  | "immobilien_anfrage"
  | "allgemeine_anfrage"
  | "system_mail"
  | "verifizierung"
  | "newsletter"
  | "spam"
  | "antwort_auf_eigene_mail"
  | "besichtigung"
  | "mietanfrage"
  | "kaufanfrage"
  | "portal_anfrage"
  | "werbung"
  | "system"
  | "benachrichtigung";

export type MailVorgangClassification = {
  /** @deprecated Nutze ist_echter_vorgang */
  ist_vorgang: boolean;
  ist_echter_vorgang: boolean;
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
      "ist_echter_vorgang": true,
      "grund": "kurze Begründung",
      "kategorie": "besichtigung|mietanfrage|kaufanfrage|allgemeine_anfrage|portal_anfrage|spam|newsletter|werbung|system|benachrichtigung",
      "absender_typ": "privat_person|unternehmen|system|unbekannt"
    }
  ]
}

Regeln:
- ECHTER VORGANG (ist_echter_vorgang: true): echte Person, konkretes Anliegen, Antwort erwartet
- ZU ARCHIVIEREN (ist_echter_vorgang: false): Newsletter, Werbung, Spam, System-Mails, Codes, automatische Benachrichtigungen
- System-Mails (noreply, Bestätigungen, DocuSign, Stripe): ist_echter_vorgang = false, kategorie = system
- Newsletter/Marketing: ist_echter_vorgang = false
- Im Zweifel: ist_echter_vorgang = false`;

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

function normalizeClassification(
  result: Partial<MailVorgangClassification> & { messageId?: string }
): MailVorgangClassification | null {
  if (!result.messageId) return null;

  const istEcht =
    typeof result.ist_echter_vorgang === "boolean"
      ? result.ist_echter_vorgang
      : Boolean(result.ist_vorgang);

  return {
    ist_vorgang: istEcht,
    ist_echter_vorgang: istEcht,
    grund: result.grund?.trim() || "KI-Klassifikation",
    kategorie: result.kategorie ?? "system_mail",
    absender_typ: result.absender_typ ?? "unbekannt",
  };
}

function parseClassificationPayload(
  raw: string | null,
  inputs: MailClassificationInput[]
): Map<string, MailVorgangClassification> {
  const fallback = new Map<string, MailVorgangClassification>();

  for (const input of inputs) {
    fallback.set(input.messageId, {
      ist_vorgang: false,
      ist_echter_vorgang: false,
      grund: "Im Zweifel kein Vorgang (Fallback)",
      kategorie: "system_mail",
      absender_typ: "unbekannt",
    });
  }

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as {
      results?: Array<Partial<MailVorgangClassification> & { messageId?: string }>;
    };

    for (const result of parsed.results ?? []) {
      const normalized = normalizeClassification(result);
      if (!normalized || !result.messageId) continue;
      fallback.set(result.messageId, normalized);
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

    const raw = await response.text();
    let payload: {
      results?: Array<Partial<MailVorgangClassification> & { messageId: string }>;
    };
    try {
      payload = JSON.parse(raw) as {
        results?: Array<Partial<MailVorgangClassification> & { messageId: string }>;
      };
    } catch {
      return parseClassificationPayload(null, inputs);
    }

    const mapped = new Map<string, MailVorgangClassification>();
    for (const result of payload.results ?? []) {
      const normalized = normalizeClassification(result);
      if (!normalized) continue;
      mapped.set(result.messageId, normalized);
    }

    if (mapped.size === 0) {
      return parseClassificationPayload(null, inputs);
    }

    return mapped;
  } catch {
    return parseClassificationPayload(null, inputs);
  }
}
