type ActivationEmailInput = {
  firstName: string;
  onboardingUrl: string;
};

export function buildActivationEmailHtml(input: ActivationEmailInput): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HELPY ist bereit</title>
</head>
<body style="margin:0;padding:0;background:#F7F6F2;font-family:'DM Sans',Arial,sans-serif;color:#1E1B4B;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(79,70,229,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5,#6366F1);padding:32px 28px;text-align:center;">
              <div style="font-size:42px;line-height:1;">🤖</div>
              <div style="margin-top:12px;font-family:Georgia,'Playfair Display',serif;font-size:28px;color:#ffffff;font-weight:600;">
                HELPY ist bereit
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                Hallo ${input.firstName},
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">
                dein HELPY-Zugang ist jetzt aktiv! In wenigen Minuten richtest du HELPY
                auf dein Unternehmen ein — danach arbeitet er für dich.
              </p>
              <a href="${input.onboardingUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6366F1);color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:12px;">
                HELPY jetzt einrichten →
              </a>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#94A3B8;">
                Dauert nur 5 Minuten. Du kannst jederzeit in den Einstellungen nachjustieren.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildActivationEmailText(input: ActivationEmailInput): string {
  return `Hallo ${input.firstName},

dein HELPY-Zugang ist jetzt aktiv!

HELPY jetzt einrichten: ${input.onboardingUrl}

In wenigen Minuten bist du startklar.`;
}
