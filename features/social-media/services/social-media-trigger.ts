"use client";

import { pushNotification } from "@/features/notifications/services/notification-store";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";

let inflight = new Set<string>();

export function isObjectOnline(object: RealEstateObject): boolean {
  return object.status === "aktiv" || object.aktiv === true;
}

export function didObjectBecomeOnline(
  previous: RealEstateObject | null | undefined,
  next: RealEstateObject
): boolean {
  if (!isObjectOnline(next)) return false;
  if (!previous) return true;
  return !isObjectOnline(previous);
}

export async function triggerSocialPostsForObject(
  object: RealEstateObject
): Promise<void> {
  if (inflight.has(object.objectId)) return;
  inflight.add(object.objectId);

  try {
    const response = await fetch("/api/social-media/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ object }),
    });

    if (!response.ok) {
      console.warn("[social-media] generate failed:", response.status);
      return;
    }

    pushNotification({
      id: `social-${object.objectId}-${Date.now()}`,
      kind: "social_media_bereit",
      title: "📱 Neues Objekt online",
      message: "Social Media Posts bereit zur Prüfung",
      href: `/social-media?objektId=${encodeURIComponent(object.objectId)}`,
      createdAt: new Date().toISOString(),
      read: false,
      priority: "normal",
    });
  } catch (error) {
    console.warn(
      "[social-media] trigger failed:",
      error instanceof Error ? error.message : "unknown"
    );
  } finally {
    inflight.delete(object.objectId);
  }
}

export function queueSocialPostsIfActivated(
  previous: RealEstateObject | null | undefined,
  next: RealEstateObject
): void {
  if (!didObjectBecomeOnline(previous, next)) return;
  void triggerSocialPostsForObject(next);
}
