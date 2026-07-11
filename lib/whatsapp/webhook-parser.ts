export type ParsedWhatsappInboundMessage = {
  messageId: string;
  fromNumber: string;
  fromName?: string;
  body: string;
  messageType: string;
  phoneNumberId: string;
  wabaId?: string;
  displayPhoneNumber?: string;
  receivedAt: string;
};

type WhatsappWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          id?: string;
          from?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

function extractMessageBody(message: {
  type?: string;
  text?: { body?: string };
}): string {
  if (typeof message.text?.body === "string") return message.text.body;
  return "";
}

export function parseWhatsappWebhookPayload(
  payload: unknown
): ParsedWhatsappInboundMessage[] {
  if (!payload || typeof payload !== "object") return [];

  const body = payload as WhatsappWebhookPayload;
  if (body.object !== "whatsapp_business_account") return [];

  const parsed: ParsedWhatsappInboundMessage[] = [];

  for (const entry of body.entry ?? []) {
    const wabaId = entry.id;

    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;

      const value = change.value;
      if (!value || value.messaging_product !== "whatsapp") continue;

      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      const contactNameByWaId = new Map<string, string>();
      for (const contact of value.contacts ?? []) {
        const waId = contact.wa_id;
        const name = contact.profile?.name;
        if (waId && name) contactNameByWaId.set(waId, name);
      }

      for (const message of value.messages ?? []) {
        if (!message.id || !message.from) continue;

        const timestampSeconds = Number(message.timestamp ?? Date.now() / 1000);
        const receivedAt = Number.isFinite(timestampSeconds)
          ? new Date(timestampSeconds * 1000).toISOString()
          : new Date().toISOString();

        parsed.push({
          messageId: message.id,
          fromNumber: message.from,
          fromName: contactNameByWaId.get(message.from),
          body: extractMessageBody(message),
          messageType: message.type ?? "text",
          phoneNumberId,
          wabaId,
          displayPhoneNumber: value.metadata?.display_phone_number,
          receivedAt,
        });
      }
    }
  }

  return parsed;
}
