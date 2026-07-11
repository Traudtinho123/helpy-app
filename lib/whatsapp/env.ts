export type WhatsappEnv = {
  appId: string;
  appSecret: string;
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
};

export function getWhatsappEnv(): WhatsappEnv {
  return {
    appId: process.env.WHATSAPP_APP_ID ?? "",
    appSecret: process.env.WHATSAPP_APP_SECRET ?? "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "",
  };
}

export function isWhatsappConfigured(): boolean {
  const env = getWhatsappEnv();
  return Boolean(
    env.accessToken &&
      env.phoneNumberId &&
      env.webhookVerifyToken &&
      env.appSecret
  );
}
