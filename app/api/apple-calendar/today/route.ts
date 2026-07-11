import { NextResponse } from "next/server";
import { mapAppleEventsToCalendarEvents } from "@/features/apple-calendar/services/apple-calendar-mapper";
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

  console.log("Apple CalDAV Server Sync gestartet");

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const credentials = readAppleCredentials(body);

    if (!credentials) {
      return NextResponse.json(
        {
          connected: false,
          error: "Apple Kalender konnte nicht gelesen werden. Bitte Zugang prüfen.",
        },
        { status: 400 }
      );
    }

    const result = await appleCalDavServer.syncTodayEvents(credentials);
    const eventsToday = mapAppleEventsToCalendarEvents(result.events);
    const lastSync = new Date().toISOString();

    console.log(`Kalender gefunden: ${result.calendars.length}`);
    console.log(`Termine heute: ${eventsToday.length}`);

    return NextResponse.json({
      connected: true,
      calendarsFound: result.calendars.length,
      eventsToday,
      lastSync,
    });
  } catch (error) {
    const mapped = mapCalDavError(error);
    console.error("Apple CalDAV Server Sync fehlgeschlagen:", mapped.message);

    return NextResponse.json(
      {
        connected: false,
        error: mapped.message,
      },
      { status: mapped.status }
    );
  }
}
