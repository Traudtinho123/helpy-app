import crypto from "crypto";
import { getTwilioConfig } from "@/lib/voice/twilio-env";

/** Validiert Twilio X-Twilio-Signature (optional in Dev ohne Token). */
export function validateTwilioWebhookSignature(
  requestUrl: string,
  params: Record<string, string>,
  signatureHeader: string | null
): boolean {
  const config = getTwilioConfig();
  if (!config?.authToken) return true;

  if (!signatureHeader) return false;

  const sortedKeys = Object.keys(params).sort();
  let data = requestUrl;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const expected = crypto
    .createHmac("sha1", config.authToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
  } catch {
    return false;
  }
}

export async function parseTwilioFormBody(
  request: Request
): Promise<Record<string, string>> {
  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

export function resolvePublicWebhookUrl(request: Request): string {
  const config = getTwilioConfig();
  if (config?.webhookBaseUrl) {
    const url = new URL(request.url);
    return `${config.webhookBaseUrl}${url.pathname}${url.search}`;
  }
  return request.url;
}
