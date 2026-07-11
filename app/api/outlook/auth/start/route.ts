import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildOutlookAuthStartUrl,
  isOutlookOAuthConfigured,
  OUTLOOK_OAUTH_STATE_COOKIE,
} from "@/features/outlook/services/outlook-auth-server";

export async function GET(): Promise<NextResponse> {
  if (!isOutlookOAuthConfigured()) {
    return NextResponse.json(
      { error: "Microsoft OAuth ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(OUTLOOK_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const url = buildOutlookAuthStartUrl(state);
  return NextResponse.redirect(url);
}
