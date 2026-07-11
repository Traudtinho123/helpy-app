import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWhatsappWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;

  const expectedPrefix = "sha256=";
  if (!signatureHeader.startsWith(expectedPrefix)) return false;

  const received = signatureHeader.slice(expectedPrefix.length);
  const computed = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (received.length !== computed.length) return false;

  try {
    return timingSafeEqual(Buffer.from(received), Buffer.from(computed));
  } catch {
    return false;
  }
}
