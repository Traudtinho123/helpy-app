import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type {
  CreateNotificationInput,
  NotificationDbRecord,
  NotificationPriority,
} from "@/lib/notifications/notification-types";

const devNotifications = new Map<string, NotificationDbRecord>();

function rowToRecord(row: Record<string, unknown>): NotificationDbRecord {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    typ: String(row.typ),
    titel: String(row.titel),
    beschreibung: (row.beschreibung as string | null) ?? null,
    link: (row.link as string | null) ?? null,
    gelesen: Boolean(row.gelesen),
    prioritaet: (row.prioritaet as NotificationPriority) ?? "normal",
    created_at: String(row.created_at),
  };
}

function generateDevId(): string {
  return `dev-notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listNotificationsForCompany(
  companyId: string,
  limit = 50
): Promise<NotificationDbRecord[]> {
  if (!isSupabaseAdminConfigured()) {
    return [...devNotifications.values()]
      .filter((item) => item.company_id === companyId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, limit);
  }

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("notifications")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function findUnreadNotificationByTypAndLink(
  companyId: string,
  typ: string,
  link: string | null
): Promise<NotificationDbRecord | null> {
  if (!typ.trim()) return null;

  if (!isSupabaseAdminConfigured()) {
    const match = [...devNotifications.values()].find(
      (item) =>
        item.company_id === companyId &&
        item.typ === typ &&
        item.link === link &&
        !item.gelesen
    );
    return match ?? null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  let query = admin
    .from("notifications")
    .select("*")
    .eq("company_id", companyId)
    .eq("typ", typ)
    .eq("gelesen", false)
    .limit(1);

  if (link) {
    query = query.eq("link", link);
  } else {
    query = query.is("link", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function insertNotification(
  input: CreateNotificationInput
): Promise<NotificationDbRecord | null> {
  const existing = await findUnreadNotificationByTypAndLink(
    input.company_id,
    input.typ,
    input.link ?? null
  );
  if (existing) return existing;

  const payload = {
    company_id: input.company_id,
    typ: input.typ,
    titel: input.titel.trim(),
    beschreibung: input.beschreibung?.trim() || null,
    link: input.link?.trim() || null,
    prioritaet: input.prioritaet ?? "normal",
    gelesen: false,
  };

  if (!isSupabaseAdminConfigured()) {
    const now = new Date().toISOString();
    const record: NotificationDbRecord = {
      id: generateDevId(),
      ...payload,
      created_at: now,
    };
    devNotifications.set(record.id, record);
    return record;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("notifications")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[notifications] insert failed:", error?.message);
    return null;
  }

  return rowToRecord(data as Record<string, unknown>);
}

export async function markNotificationReadById(
  companyId: string,
  notificationId: string
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    const record = devNotifications.get(notificationId);
    if (!record || record.company_id !== companyId) return false;
    devNotifications.set(notificationId, { ...record, gelesen: true });
    return true;
  }

  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin
    .from("notifications")
    .update({ gelesen: true })
    .eq("company_id", companyId)
    .eq("id", notificationId);

  return !error;
}

export async function markAllNotificationsReadForCompany(
  companyId: string
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    for (const [id, record] of devNotifications.entries()) {
      if (record.company_id === companyId) {
        devNotifications.set(id, { ...record, gelesen: true });
      }
    }
    return true;
  }

  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin
    .from("notifications")
    .update({ gelesen: true })
    .eq("company_id", companyId)
    .eq("gelesen", false);

  return !error;
}
