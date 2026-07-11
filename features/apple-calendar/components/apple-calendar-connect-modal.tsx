"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { listAppleCalendars } from "@/features/apple-calendar/services/apple-calendar-sync";
import type { AppleCalDavCalendar } from "@/features/apple-calendar/types/apple-calendar-types";

type AppleCalendarConnectModalProps = {
  open: boolean;
  onClose: () => void;
  onConnect: (input: {
    appleIdEmail: string;
    appSpecificPassword: string;
    calendarId: string;
  }) => Promise<{ success: boolean; errorMessage?: string }>;
};

export function AppleCalendarConnectModal({
  open,
  onClose,
  onConnect,
}: AppleCalendarConnectModalProps) {
  const [appleIdEmail, setAppleIdEmail] = useState("");
  const [appSpecificPassword, setAppSpecificPassword] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [calendars, setCalendars] = useState<AppleCalDavCalendar[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAppleIdEmail("");
      setAppSpecificPassword("");
      setCalendarId("");
      setCalendars([]);
      setError(null);
    }
  }, [open]);

  const handleLoadCalendars = async () => {
    setError(null);

    if (!appleIdEmail.trim()) {
      setError("Bitte gib deine Apple-ID E-Mail ein.");
      return;
    }
    if (!appSpecificPassword.trim()) {
      setError("Bitte gib deinen Zugangscode ein.");
      return;
    }

    setLoadingCalendars(true);
    try {
      const items = await listAppleCalendars({
        appleIdEmail: appleIdEmail.trim(),
        appSpecificPassword: appSpecificPassword.trim(),
      });
      setCalendars(items);
      const primary = items.find((item) => item.isPrimary) ?? items[0];
      setCalendarId(primary?.id ?? "");
      if (items.length === 0) {
        setError("Es wurden keine Kalender gefunden.");
      }
    } catch {
      setCalendars([]);
      setCalendarId("");
      setError("Kalender konnten nicht geladen werden. Bitte Zugangsdaten prüfen.");
    } finally {
      setLoadingCalendars(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!appleIdEmail.trim()) {
      setError("Bitte gib deine Apple-ID E-Mail ein.");
      return;
    }
    if (!appSpecificPassword.trim()) {
      setError("Bitte gib deinen Zugangscode ein.");
      return;
    }
    if (!calendarId) {
      setError("Bitte wähle einen Kalender aus.");
      return;
    }

    setConnecting(true);
    const result = await onConnect({
      appleIdEmail: appleIdEmail.trim(),
      appSpecificPassword: appSpecificPassword.trim(),
      calendarId,
    });
    setConnecting(false);

    if (result.success) {
      onClose();
      return;
    }

    setError(
      result.errorMessage ??
        "Verbindung fehlgeschlagen. Bitte Eingaben prüfen und erneut versuchen."
    );
  };

  return (
    <Modal
      open={open}
      title="Apple Kalender verbinden"
      description="HELPY liest deine Termine — nur lesen, keine Änderungen."
      onClose={connecting ? () => {} : onClose}
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={connecting}
            className="h-10 rounded-[12px] px-4 text-[12px] font-medium"
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={connecting || loadingCalendars || !calendarId}
            className="h-10 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-5 text-[12px] font-semibold text-white"
          >
            {connecting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Verbinden"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label
            htmlFor="apple-id-email"
            className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase"
          >
            Apple-ID E-Mail
          </label>
          <Input
            id="apple-id-email"
            type="email"
            autoComplete="username"
            placeholder="name@icloud.com"
            value={appleIdEmail}
            onChange={(event) => setAppleIdEmail(event.target.value)}
            className="mt-1.5 h-10"
            disabled={connecting}
          />
        </div>

        <div>
          <label
            htmlFor="app-specific-password"
            className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase"
          >
            App-Zugangscode
          </label>
          <Input
            id="app-specific-password"
            type="password"
            autoComplete="off"
            placeholder="xxxx-xxxx-xxxx-xxxx"
            value={appSpecificPassword}
            onChange={(event) => setAppSpecificPassword(event.target.value)}
            className="mt-1.5 h-10"
            disabled={connecting}
          />
          <p className="mt-2 rounded-[12px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#2563EB]">
            Erstelle einen Zugangscode in deinen Apple-Einstellungen. Dein
            normales Apple-ID Passwort wird nicht verwendet.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="apple-calendar-select"
              className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase"
            >
              Kalender auswählen
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleLoadCalendars()}
              disabled={connecting || loadingCalendars}
              className="h-8 rounded-[10px] px-3 text-[11px] font-medium"
            >
              {loadingCalendars ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Kalender laden"
              )}
            </Button>
          </div>
          {calendars.length === 0 ? (
            <p className="mt-2 text-[12px] text-[#64748B]">
              Zuerst Zugangsdaten eingeben und Kalender laden.
            </p>
          ) : (
            <select
              id="apple-calendar-select"
              value={calendarId}
              onChange={(event) => setCalendarId(event.target.value)}
              disabled={connecting || calendars.length === 0}
              className="mt-1.5 h-10 w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 text-[13px] text-[#0F172A] outline-none focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20 disabled:opacity-50"
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <p className="rounded-[12px] border border-[#FECACA]/60 bg-[#FEF2F2]/80 px-3 py-2 text-[11px] text-[#DC2626]">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
