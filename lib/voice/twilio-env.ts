export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  phoneNumber: string | null;
  webhookBaseUrl: string;
};

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim()
  );
}

export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) return null;

  return {
    accountSid,
    authToken,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER?.trim() ?? null,
    webhookBaseUrl:
      process.env.VOICE_WEBHOOK_BASE_URL?.trim()?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "") ??
      "http://localhost:3000",
  };
}

export function buildVoiceWebhookUrl(path: string, companyId: string): string {
  const base = getTwilioConfig()?.webhookBaseUrl ?? "http://localhost:3000";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}?companyId=${encodeURIComponent(companyId)}`;
}
