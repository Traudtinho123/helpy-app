import { createClient } from "@/lib/supabase/client";

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const HELPY_TIMEZONE = "Europe/Zurich";

export type CreateGoogleCalendarEventInput = {
  accessToken: string;
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  calendarId?: string;
};

export type CreateGoogleCalendarEventResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

function buildDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/** Liest Google Access Token aus der Supabase-Session. */
export async function getGoogleCalendarAccessToken(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.provider_token ?? null;
}

/** Erstellt einen Termin im primären Google Kalender. */
export async function createGoogleCalendarEvent(
  input: CreateGoogleCalendarEventInput
): Promise<CreateGoogleCalendarEventResult> {
  const { accessToken, summary, date, startTime, endTime, location, description } =
    input;

  if (!accessToken) {
    return { ok: false, error: "Nicht mit Google verbunden." };
  }

  const calendarId = encodeURIComponent(input.calendarId ?? "primary");

  const payload = {
    summary,
    location: location ?? undefined,
    description: description ?? undefined,
    start: {
      dateTime: buildDateTime(date, startTime),
      timeZone: HELPY_TIMEZONE,
    },
    end: {
      dateTime: buildDateTime(date, endTime),
      timeZone: HELPY_TIMEZONE,
    },
  };

  try {
    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          error:
            "Kein Zugriff auf Google Kalender. Bitte melde dich erneut mit Google an.",
        };
      }
      return {
        ok: false,
        error: detail || `Google Kalender Fehler (${response.status})`,
      };
    }

    const data = (await response.json()) as { id?: string };

    return {
      ok: true,
      eventId: data.id ?? `google-${Date.now()}`,
    };
  } catch {
    return { ok: false, error: "Google Kalender Termin konnte nicht gespeichert werden." };
  }
}
