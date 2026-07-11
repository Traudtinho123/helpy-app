import { classifyWhatsappMessage } from "@/features/whatsapp/services/whatsapp-message-classifier";
import { findCustomerIdByPhone } from "@/features/whatsapp/services/whatsapp-customer-match";
import {
  applyWhatsappClassification,
  fetchCompanyIdByPhoneNumberId,
  insertWhatsappMessageIfNew,
} from "@/features/whatsapp/services/whatsapp-repository";
import type { ParsedWhatsappInboundMessage } from "@/lib/whatsapp/webhook-parser";
import { createAdminClient } from "@/lib/supabase/admin";

export async function processWhatsappInboundMessages(
  messages: ParsedWhatsappInboundMessage[]
): Promise<void> {
  const admin = createAdminClient();
  if (!admin || messages.length === 0) return;

  for (const message of messages) {
    const companyId = await fetchCompanyIdByPhoneNumberId(
      admin,
      message.phoneNumberId
    );
    if (!companyId) continue;

    const { inserted, row } = await insertWhatsappMessageIfNew(admin, {
      companyId,
      messageId: message.messageId,
      fromNumber: message.fromNumber,
      fromName: message.fromName,
      body: message.body,
      messageType: message.messageType,
      receivedAt: message.receivedAt,
      metadata: {
        phoneNumberId: message.phoneNumberId,
        wabaId: message.wabaId,
        displayPhoneNumber: message.displayPhoneNumber,
      },
    });

    if (!inserted || !row) continue;

    const classification = classifyWhatsappMessage({
      messageId: message.messageId,
      fromNumber: message.fromNumber,
      fromName: message.fromName,
      body: message.body,
      receivedAt: message.receivedAt,
    });

    const customerMatch = await findCustomerIdByPhone(
      admin,
      companyId,
      message.fromNumber
    );

    await applyWhatsappClassification(admin, companyId, row.id, {
      ...classification,
      customerId: customerMatch?.id ?? null,
    });
  }
}
