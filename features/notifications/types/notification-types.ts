export type HelpyNotificationKind =
  | "anfrage"
  | "baustellen_anfrage"
  | "neuer_kunde"
  | "angebot_vorbereitet"
  | "spam_archiv"
  | "gmail_entwurf"
  | "gmail_gesendet"
  | "kalender_termin"
  | "followup_kunde_wartet"
  | "followup_angebot_offen"
  | "voice_notfall"
  | "voice_anruf";

export type HelpyNotification = {
  id: string;
  kind: HelpyNotificationKind;
  title: string;
  message: string;
  vorgangId?: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export type NotificationTimeGroup = "heute" | "gestern" | "diese_woche";

export type GroupedHelpyNotifications = {
  group: NotificationTimeGroup;
  label: string;
  items: HelpyNotification[];
};

export const NOTIFICATION_KIND_LABELS: Record<HelpyNotificationKind, string> = {
  anfrage: "Neue Anfrage",
  baustellen_anfrage: "Neue Baustellenanfrage",
  neuer_kunde: "Neuer Kunde erkannt",
  angebot_vorbereitet: "Neues Angebot vorbereitet",
  spam_archiv: "Spam zum Archivieren vorbereitet",
  gmail_entwurf: "Gmail Entwurf gespeichert",
  gmail_gesendet: "Gmail gesendet",
  kalender_termin: "Kalender Termin erkannt",
  followup_kunde_wartet: "Kunde wartet",
  followup_angebot_offen: "Angebot offen",
  voice_notfall: "Notfall — Telefon",
  voice_anruf: "Telefonanruf",
};
