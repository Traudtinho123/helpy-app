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
        {
          ok: false,
          error: "Apple Kalender konnte nicht gelesen werden. Bitte Zugang prüfen.",
        },
        { status: 400 }
      );
    }

    const calendarId = String(body.calendarId ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const date = String(body.date ?? "").trim();
    const startTime = String(body.startTime ?? "").trim();
    const endTime = String(body.endTime ?? "").trim();
    const uid = String(body.uid ?? `helpy-${Date.now()}@helpy.app`).trim();
    const location =
      typeof body.location === "string" ? body.location.trim() : undefined;
    const description =
      typeof body.description === "string" ? body.description.trim() : undefined;

    if (!calendarId || !summary || !date || !startTime || !endTime) {
      return NextResponse.json(
        {
          ok: false,
          error: "Termin konnte nicht im Apple Kalender gespeichert werden. Bitte Verbindung prüfen.",
        },
        { status: 400 }
      );
    }

    const result = await appleCalDavServer.createEvent(credentials, {
      calendarId,
      uid,
      summary,
      date,
      startTime,
      endTime,
      location,
      description,
    });

    return NextResponse.json({
      ok: true,
      uid: result.uid,
    });
  } catch (error) {
    const mapped = mapCalDavError(error);

    return NextResponse.json(
      {
        ok: false,
        error:
          mapped.status === 401 || mapped.status === 403
            ? "Termin konnte nicht im Apple Kalender gespeichert werden. Bitte Verbindung prüfen."
            : mapped.message,
      },
      { status: mapped.status }
    );
  }
}
