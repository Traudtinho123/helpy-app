import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    configured: false,
    mode: "mock",
    message: "Twilio ist deaktiviert. Voice Core v1 nutzt MockProvider.",
  });
}
