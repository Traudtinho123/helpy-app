import type { WeeklyReportData } from "@/features/weekly-report/types/weekly-report-types";
import { HELPY_MAIL_SUBJECT_PREFIX } from "@/features/workspace/services/vorgaenge/helpy-report-detector";

const BRAND = {
  primary: "#2563EB",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#F8FAFC",
  success: "#047857",
  warning: "#B45309",
  danger: "#DC2626",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trendColor(trend: "up" | "down" | "flat"): string {
  if (trend === "up") return BRAND.success;
  if (trend === "down") return BRAND.danger;
  return BRAND.muted;
}

function renderMetrics(data: WeeklyReportData): string {
  return data.metrics
    .map(
      (metric) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.text};">
            ${escapeHtml(metric.label)}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-size:18px;font-weight:700;color:${BRAND.text};">
            ${metric.current}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-size:12px;color:${trendColor(metric.trend)};white-space:nowrap;">
            ${escapeHtml(metric.changeLabel)}
          </td>
        </tr>`
    )
    .join("");
}

function renderStaleList(data: WeeklyReportData): string {
  if (data.staleWaiting.length === 0) {
    return `<p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">Keine Vorgänge warten länger als 3 Tage auf Antwort.</p>`;
  }

  return `<ul style="margin:0;padding:0;list-style:none;">
    ${data.staleWaiting
      .map(
        (item) => `
        <li style="margin:0 0 10px;padding:12px 14px;border:1px solid ${BRAND.border};border-radius:12px;background:#fff;">
          <strong style="display:block;font-size:14px;color:${BRAND.text};">${escapeHtml(item.kundeName)}</strong>
          <span style="font-size:13px;color:${BRAND.warning};">${item.daysWaiting} Tage seit letztem Kontakt</span>
        </li>`
      )
      .join("")}
  </ul>`;
}

function renderRecommendations(data: WeeklyReportData): string {
  return `<ul style="margin:0;padding:0 0 0 18px;">
    ${data.recommendations
      .map(
        (item) =>
          `<li style="margin:0 0 10px;font-size:14px;line-height:1.65;color:${BRAND.text};">${escapeHtml(item.text)}</li>`
      )
      .join("")}
  </ul>`;
}

export function buildWeeklyReportSubject(data: WeeklyReportData): string {
  return `${HELPY_MAIL_SUBJECT_PREFIX} Deine HELPY Wochenzusammenfassung – KW ${data.weekNumber}`;
}

export function buildWeeklyReportHtml(data: WeeklyReportData): string {
  const greeting = data.recipientName
    ? `Guten Morgen ${escapeHtml(data.recipientName)}`
    : "Guten Morgen";

  const intro = data.isLowActivity
    ? "Du hast HELPY letzte Woche noch wenig genutzt — hier ist trotzdem dein Überblick. Starte diese Woche mit deinen offenen Vorgängen."
    : `Hier ist dein Rückblick für ${escapeHtml(data.weekLabel)}.`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(buildWeeklyReportSubject(data))}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.surface};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 20px;background:linear-gradient(135deg,${BRAND.primary} 0%,#1D4ED8 100%);color:#ffffff;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">HELPY Wochenbericht</p>
              <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;">${escapeHtml(data.companyName)}</h1>
              <p style="margin:10px 0 0;font-size:14px;opacity:0.92;">KW ${data.weekNumber}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:${BRAND.text};">${greeting},</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.65;color:${BRAND.muted};">${intro}</p>

              <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Rückblick letzte Woche</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                ${renderMetrics(data)}
              </table>

              <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Aktuell offen</h2>
              <p style="margin:0 0 12px;font-size:14px;color:${BRAND.text};"><strong>${data.openTotal}</strong> offene Vorgänge gesamt</p>
              ${renderStaleList(data)}

              <h2 style="margin:28px 0 12px;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">HELPY empfiehlt diese Woche</h2>
              ${renderRecommendations(data)}

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:32px auto 0;">
                <tr>
                  <td style="border-radius:12px;background:${BRAND.primary};">
                    <a href="${escapeHtml(data.vorgaengeUrl)}" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Zu meinen offenen Vorgängen</a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center;">
                Wochenbericht deaktivieren: <a href="${escapeHtml(data.settingsUrl)}" style="color:${BRAND.primary};">Einstellungen</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#94A3B8;">© HELPY — Dein KI-Bürokollege</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWeeklyReportText(data: WeeklyReportData): string {
  const lines = [
    buildWeeklyReportSubject(data),
    "",
    data.recipientName ? `Guten Morgen ${data.recipientName},` : "Guten Morgen,",
    "",
    "Rückblick letzte Woche:",
    ...data.metrics.map(
      (m) => `- ${m.label}: ${m.current} (${m.changeLabel})`
    ),
    "",
    `Offene Vorgänge gesamt: ${data.openTotal}`,
    ...data.staleWaiting.map(
      (s) => `- ${s.kundeName}: ${s.daysWaiting} Tage wartend`
    ),
    "",
    "HELPY empfiehlt:",
    ...data.recommendations.map((r) => `- ${r.text}`),
    "",
    `Vorgänge öffnen: ${data.vorgaengeUrl}`,
    `Abmelden: ${data.settingsUrl}`,
  ];
  return lines.join("\n");
}
