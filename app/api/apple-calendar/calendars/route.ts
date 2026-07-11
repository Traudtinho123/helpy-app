import { NextResponse } from "next/server";
import { appleCalDavServer } from "@/features/apple-calendar/services/apple-caldav-server";
import {
  mapCalDavError,
  readAppleCredentials,
} from "@/features/apple-calendar/services/apple-caldav-errors";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const credentials = readAppleCredentials(body);

    if (!credentials) {
      return NextResponse.json(
        { error: "Apple Kalender konnte nicht gelesen werden. Bitte Zugang prüfen." },
        { status: 400 }
      );
    }

    const calendars = await appleCalDavServer.listCalendars(credentials);

    if (calendars.length === 0) {
      return NextResponse.json(
        { error: "Keine Apple Kalender gefunden." },
        { status: 404 }
      );
    }

    return NextResponse.json({ calendars });
  } catch (error) {
    const mapped = mapCalDavError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
