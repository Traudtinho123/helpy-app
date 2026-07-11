import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Twilio-Provider ist nicht aktiv (Mock-Modus)." },
    { status: 503 }
  );
}
