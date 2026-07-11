import { NextResponse } from "next/server";

/** Twilio-Webhooks deaktiviert — Voice Core v1 nutzt MockProvider. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Twilio-Provider ist nicht aktiv. HELPY Voice Core v1 läuft im Mock-Modus.",
    },
    { status: 503 }
  );
}

export async function GET() {
  return POST();
}
