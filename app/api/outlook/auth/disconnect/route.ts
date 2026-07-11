import { NextResponse } from "next/server";
import { clearOutlookTokensFromCookies } from "@/features/outlook/services/outlook-auth-server";

export async function POST(): Promise<NextResponse> {
  await clearOutlookTokensFromCookies();
  return NextResponse.json({ ok: true });
}
