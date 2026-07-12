type HelpyEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export type HelpyEmailResult = {
  ok: boolean;
  error?: string;
};

const DEFAULT_HELPY_MAIL_FROM = "HELPY <onboarding@helpy.app>";

function resolveHelpyMailFrom(): string {
  return (
    process.env.HELPY_MAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    DEFAULT_HELPY_MAIL_FROM
  );
}

async function postResendEmail(input: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean; status: number; details: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  const details = await response.text();
  return { ok: response.ok, status: response.status, details };
}

/**
 * Einfacher Mail-Versand — loggt immer, optional Resend wenn konfiguriert.
 */
export async function sendHelpyEmail(input: HelpyEmailInput): Promise<boolean> {
  const result = await sendHelpyEmailDetailed(input);
  return result.ok;
}

export async function sendHelpyEmailDetailed(
  input: HelpyEmailInput
): Promise<HelpyEmailResult> {
  console.log("[helpy-mail]", {
    to: input.to,
    subject: input.subject,
    preview: input.text.slice(0, 120),
  });

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = resolveHelpyMailFrom();

  if (!apiKey) {
    console.warn("[helpy-mail] RESEND_API_KEY fehlt — E-Mail nur geloggt.");
    return { ok: true };
  }

  try {
    const attempt = await postResendEmail({
      apiKey,
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });

    if (!attempt.ok) {
      console.error("[helpy-mail] Resend failed:", attempt.status, attempt.details);

      if (attempt.details.includes("not verified")) {
        return {
          ok: false,
          error:
            "E-Mail-Domain bei Resend noch nicht verifiziert. Bitte helpy.app in resend.com verifizieren und HELPY_MAIL_FROM=HELPY <onboarding@helpy.app> in Vercel setzen.",
        };
      }

      return { ok: false, error: "E-Mail-Versand über Resend fehlgeschlagen." };
    }

    return { ok: true };
  } catch (error) {
    console.error(
      "[helpy-mail] send error:",
      error instanceof Error ? error.message : "unknown"
    );
    return { ok: false, error: "E-Mail-Versand fehlgeschlagen." };
  }
}

export const SUPER_ADMIN_NOTIFY_EMAIL =
  process.env.HELPY_SUPER_ADMIN_EMAIL?.trim() ?? "viktortraudt0@gmail.com";
