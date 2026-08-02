export type HelpyNotificationPriority = "wichtig" | "normal";

export type HelpyNotificationKind =
  | "besichtigungsanfrage"
  | "neuer_interessent"
  | "vorgang_prioritaet_hoch"
  | "vorgang_wartet_24h"
  | "voice_anruf"
  | "voice_notfall"
  | "termin_bald"
  | "mail_verarbeitet"
  | "kalender_sync"
  | "weekly_report"
  | "anfrage"
  | "baustellen_anfrage"
  | "angebot_vorbereitet"
  | "gmail_entwurf"
  | "gmail_gesendet"
  | "social_media_bereit";

export type HelpyNotification = {
  id: string;
  kind: HelpyNotificationKind;
  title: string;
  message: string;
  vorgangId?: string;
  href: string;
  createdAt: string;
  read: boolean;
  priority: HelpyNotificationPriority;
};

export type NotificationTimeGroup = "heute" | "gestern" | "diese_woche";

export type GroupedHelpyNotifications = {
  group: NotificationTimeGroup;
  label: string;
  items: HelpyNotification[];
};

export const NOTIFICATION_KIND_LABELS: Record<HelpyNotificationKind, string> = {
  besichtigungsanfrage: "🏠 Neue Besichtigungsanfrage",
  neuer_interessent: "👤 Neuer Interessent",
  vorgang_prioritaet_hoch: "⚡ Hohe Priorität",
  vorgang_wartet_24h: "⏳ Wartet auf Antwort",
  voice_anruf: "📞 Anruf eingegangen",
  voice_notfall: "🚨 Notfall — Telefon",
  termin_bald: "📅 Termin bald",
  mail_verarbeitet: "✉️ Neue Mail verarbeitet",
  kalender_sync: "📆 Kalender synchronisiert",
  weekly_report: "📊 Wöchentlicher Report bereit",
  anfrage: "Neue Anfrage",
  baustellen_anfrage: "Neue Baustellenanfrage",
  angebot_vorbereitet: "Neues Angebot vorbereitet",
  gmail_entwurf: "Gmail Entwurf gespeichert",
  gmail_gesendet: "Gmail gesendet",
  social_media_bereit: "Social Media bereit",
};

const WICHTIG_KINDS = new Set<HelpyNotificationKind>([
  "besichtigungsanfrage",
  "neuer_interessent",
  "vorgang_prioritaet_hoch",
  "vorgang_wartet_24h",
  "voice_anruf",
  "voice_notfall",
  "termin_bald",
]);

export function resolveNotificationPriority(
  kind: HelpyNotificationKind,
  explicit?: HelpyNotificationPriority
): HelpyNotificationPriority {
  if (explicit) return explicit;
  return WICHTIG_KINDS.has(kind) ? "wichtig" : "normal";
}

export function formatNotificationRelativeTime(
  createdAt: string,
  now = new Date()
): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "";

  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "Gerade eben";
  if (diffMinutes < 60) {
    return diffMinutes === 1
      ? "Vor 1 Minute"
      : `Vor ${diffMinutes} Minuten`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? "Vor 1 Stunde" : `Vor ${diffHours} Stunden`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "Gestern" : `Vor ${diffDays} Tagen`;
}
