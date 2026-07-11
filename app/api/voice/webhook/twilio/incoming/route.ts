import { NextResponse } from "next/server";
import {
  handleTwilioIncomingCall,
} from "@/lib/voice/voice-twilio-live";
import {
  parseTwilioFormBody,
  resolvePublicWebhookUrl,
  validateTwilioWebhookSignature,
} from "@/lib/voice/twilio-webhook-auth";
import { isTwilioConfigured } from "@/lib/voice/twilio-env";

function resolveCompanyId(request: Request): string | null {
  const url = new URL(request.url);
  return url.searchParams.get("companyId")?.trim() || null;
}

async function verifyTwilioRequest(request: Request, params: Record<string, string>) {
  const signature = request.headers.get("X-Twilio-Signature");
  const webhookUrl = resolvePublicWebhookUrl(request);

  if (isTwilioConfigured() && !validateTwilioWebhookSignature(webhookUrl, params, signature)) {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  const companyId = resolveCompanyId(request);
  if (!companyId) {
    return NextResponse.json({ error: "companyId fehlt." }, { status: 400 });
  }

  const params = await parseTwilioFormBody(request);

  if (!verifyTwilioRequest(request, params)) {
    return NextResponse.json({ error: "Ungültige Twilio-Signatur." }, { status: 403 });
  }

  return handleTwilioIncomingCall(companyId, params);
}

export async function GET() {
  return NextResponse.json(
    { error: "Twilio sendet POST-Requests an diesen Webhook." },
    { status: 405 }
  );
}
