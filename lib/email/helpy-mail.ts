type HelpyEmailInput = {
  to: string;
  subject: string;
  text: string;
};

/**
 * Einfacher Mail-Versand — loggt immer, optional Resend wenn konfiguriert.
 */
export async function sendHelpyEmail(input: HelpyEmailInput): Promise<boolean> {
  console.log("[helpy-mail]", {
    to: input.to,
    subject: input.subject,
    preview: input.text.slice(0, 120),
  });

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.HELPY_MAIL_FROM?.trim() ?? "HELPY <onboarding@helpy.app>";

  if (!apiKey) {
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });

    if (!response.ok) {
      console.error("[helpy-mail] Resend failed:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[helpy-mail] send error:",
      error instanceof Error ? error.message : "unknown"
    );
    return false;
  }
}

export const SUPER_ADMIN_NOTIFY_EMAIL =
  process.env.HELPY_SUPER_ADMIN_EMAIL?.trim() ?? "viktortraudt0@gmail.com";
