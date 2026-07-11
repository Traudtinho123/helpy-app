import { NextResponse } from "next/server";
import { mapAppleEventsToCalendarEvents } from "@/features/apple-calendar/services/apple-calendar-mapper";
import { appleCalDavServer } from "@/features/apple-calendar/services/apple-caldav-server";
import {
  mapCalDavError,
  readAppleCredentials,
} from "@/features/apple-calendar/services/apple-caldav-errors";
import { getZurichDateString } from "@/features/apple-calendar/services/apple-caldav-timezone";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const credentials = readAppleCredentials(body);
    const date =
      typeof body.date === "string" && body.date.trim()
        ? body.date.trim()
        : getZurichDateString();

    if (!credentials) {
      return NextResponse.json(
        {
          connected: false,
          error: "Apple Kalender konnte nicht gelesen werden. Bitte Zugang prüfen.",
        },
        { status: 400 }
      );
    }

    const result = await appleCalDavServer.syncEventsForDate(credentials, date);
    const events = mapAppleEventsToCalendarEvents(result.events);

    return NextResponse.json({
      connected: true,
      date,
      calendarsFound: result.calendars.length,
      events,
    });
  } catch (error) {
    const mapped = mapCalDavError(error);

    return NextResponse.json(
      {
        connected: false,
        error: mapped.message,
      },
      { status: mapped.status }
    );
  }
}
