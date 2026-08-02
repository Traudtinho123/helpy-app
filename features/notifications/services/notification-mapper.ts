import type { NotificationDbRecord } from "@/lib/notifications/notification-types";
import type {
  HelpyNotification,
  HelpyNotificationKind,
  HelpyNotificationPriority,
} from "@/features/notifications/types/notification-types";
import {
  resolveNotificationPriority,
} from "@/features/notifications/types/notification-types";

export function mapDbNotificationToHelpy(
  record: NotificationDbRecord
): HelpyNotification {
  const kind = (record.typ as HelpyNotificationKind) || "anfrage";
  const href = record.link?.trim() || "/vorgaenge";
  const vorgangMatch = href.match(/\/workspace\/([^/?#]+)/);

  return {
    id: record.id,
    kind,
    title: record.titel,
    message: record.beschreibung?.trim() || record.titel,
    vorgangId: vorgangMatch?.[1],
    href,
    createdAt: record.created_at,
    read: record.gelesen,
    priority: record.prioritaet as HelpyNotificationPriority,
  };
}

export function mapHelpyNotificationToDbPayload(
  notification: HelpyNotification,
  companyId: string
) {
  return {
    company_id: companyId,
    typ: notification.kind,
    titel: notification.title,
    beschreibung: notification.message,
    link: notification.href,
    prioritaet: resolveNotificationPriority(
      notification.kind,
      notification.priority
    ),
  };
}
