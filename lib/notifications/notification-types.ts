export type NotificationPriority = "wichtig" | "normal";

export type NotificationDbRecord = {
  id: string;
  company_id: string;
  typ: string;
  titel: string;
  beschreibung: string | null;
  link: string | null;
  gelesen: boolean;
  prioritaet: NotificationPriority;
  created_at: string;
};

export type CreateNotificationInput = {
  company_id: string;
  typ: string;
  titel: string;
  beschreibung?: string | null;
  link?: string | null;
  prioritaet?: NotificationPriority;
};
