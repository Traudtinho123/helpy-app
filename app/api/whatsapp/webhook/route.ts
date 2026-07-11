import { NextResponse } from "next/server";
import { processWhatsappInboundMessages } from "@/features/whatsapp/services/whatsapp-processor";
import { getWhatsappEnv } from "@/lib/whatsapp/env";
import { verifyWhatsappWebhookSignature } from "@/lib/whatsapp/signature";
import { parseWhatsappWebhookPayload } from "@/lib/whatsapp/webhook-parser";

export const dynamic = "force-dynamic";

// Lokaler Test: ngrok http 3000 → https://[ngrok-url]/api/whatsapp/webhook

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const { webhookVerifyToken } = getWhatsappEnv();

  if (
    mode === "subscribe" &&
    token &&
    webhookVerifyToken &&
    token === webhookVerifyToken &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const { appSecret } = getWhatsappEnv();

  if (!verifyWhatsappWebhookSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = parseWhatsappWebhookPayload(payload);
  void processWhatsappInboundMessages(messages);

  return NextResponse.json({ ok: true });
}
