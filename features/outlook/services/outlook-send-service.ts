export type OutlookSendInput = {
  to: string;
  subject: string;
  body: string;
};

/** Sendet über die API-Route (Client, ohne Sync). */
export async function sendOutlookMessageViaApi(
  input: OutlookSendInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/outlook/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: string };

    return payload.ok ? { ok: true } : payload;
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Outlook konnte die E-Mail nicht senden.",
    };
  }
}
