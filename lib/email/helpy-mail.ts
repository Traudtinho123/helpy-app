type HelpyEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export type HelpyEmailResult = {
  ok: boolean;
  error?: string;
};

const RESEND_DEV_FROM = "HELPY <onboarding@resend.dev>";

function resolveHelpyMailFrom(): string {
  const candidates = [
    process.env.HELPY_MAIL_FROM?.trim(),
    process.env.RESEND_FROM_EMAIL?.trim(),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (!candidate.includes("helpy.app")) {
      return candidate;
    }
  }

  return RESEND_DEV_FROM;
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
    let attempt = await postResendEmail({
      apiKey,
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });

    const shouldRetryWithResendDev =
      !attempt.ok &&
      (attempt.details.includes("helpy.app") ||
        attempt.details.includes("not verified") ||
        from.includes("helpy.app"));

    if (shouldRetryWithResendDev && from !== RESEND_DEV_FROM) {
      console.warn("[helpy-mail] Retry with onboarding@resend.dev");
      attempt = await postResendEmail({
        apiKey,
        from: RESEND_DEV_FROM,
        to: input.to,
        subject: input.subject,
        text: input.text,
      });
    }

    if (!attempt.ok) {
      console.error("[helpy-mail] Resend failed:", attempt.status, attempt.details);

      if (attempt.details.includes("only send testing emails to your own email")) {
        return {
          ok: false,
          error:
            "Resend Testmodus: E-Mails können derzeit nur an deine Resend-Account-E-Mail gesendet werden. Bitte Domain bei resend.com verifizieren oder Supabase Auth E-Mail nutzen.",
        };
      }

      if (attempt.details.includes("not verified")) {
        return {
          ok: false,
          error:
            "E-Mail-Domain bei Resend nicht verifiziert. HELPY_MAIL_FROM auf HELPY <onboarding@resend.dev> setzen.",
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
