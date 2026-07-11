import {
  sendOutlookMail,
  withOutlookMailClient,
} from "@/features/outlook/services/outlook-mail-client";
import type { OutlookSendInput } from "@/features/outlook/services/outlook-send-service";

export { sendOutlookMail };

/** Sendet mit gültigem Token aus Cookies (nur Server/API). */
export async function sendOutlookMailWithSession(
  input: OutlookSendInput
): Promise<void> {
  await withOutlookMailClient((tokens) => sendOutlookMail(tokens, input));
}
