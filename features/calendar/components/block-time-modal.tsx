"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addBlockedTimeEvent } from "@/features/calendar/services/calendar-events-store";

type BlockTimeModalProps = {
  open: boolean;
  onClose: () => void;
  date: string;
  defaultTime?: string;
};

const DURATION_OPTIONS = [30, 60, 90] as const;

export function BlockTimeModal({
  open,
  onClose,
  date,
  defaultTime = "11:15",
}: BlockTimeModalProps) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState(defaultTime);
  const [duration, setDuration] = useState<number>(60);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    addBlockedTimeEvent({
      title: title.trim() || "Blockierte Zeit",
      date,
      time,
      durationMinutes: duration,
    });
    setSaving(false);
    setTitle("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Zeit blockieren">
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Titel
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. Angebot vorbereiten"
            className="mt-1.5"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Startzeit
          </label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Dauer
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((minutes) => (
              <Button
                key={minutes}
                type="button"
                variant={duration === minutes ? "default" : "outline"}
                className="h-8 rounded-[10px] px-3 text-[11px]"
                onClick={() => setDuration(minutes)}
              >
                {minutes} Min
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Speichern…" : "In Kalender speichern"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
