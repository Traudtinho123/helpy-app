export function mapCalDavError(error: unknown): { message: string; status: number } {
  const code = error instanceof Error ? error.message : "UNKNOWN";

  if (code === "CALDAV_AUTH_FAILED") {
    return {
      message: "Apple Kalender konnte nicht gelesen werden. Bitte Zugang prüfen.",
      status: 401,
    };
  }

  if (code === "CALDAV_NO_CALENDARS") {
    return {
      message: "Keine Apple Kalender gefunden.",
      status: 404,
    };
  }

  return {
    message: "Apple Kalender konnte nicht gelesen werden. Bitte Zugang prüfen.",
    status: 502,
  };
}

export function readAppleCredentials(body: Record<string, unknown>): {
  appleIdEmail: string;
  appSpecificPassword: string;
} | null {
  const appleIdEmail = String(body.appleId ?? body.appleIdEmail ?? "").trim();
  const appSpecificPassword = String(body.appSpecificPassword ?? "").trim();

  if (!appleIdEmail || !appSpecificPassword) {
    return null;
  }

  return { appleIdEmail, appSpecificPassword };
}
