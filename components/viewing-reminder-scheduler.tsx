"use client";

import { useEffect } from "react";
import { ensureViewingReminderScheduler } from "@/features/appointment-suggestions/services/viewing-appointment-reminders";

export function ViewingReminderScheduler() {
  useEffect(() => {
    ensureViewingReminderScheduler();
  }, []);

  return null;
}
