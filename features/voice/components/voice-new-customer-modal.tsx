"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { upsertKundenakte } from "@/features/kundenakte/services/kundenakte-store";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import { KUNDENAKTE_STATUS_LABELS } from "@/features/kundenakte/types/kundenakte-types";
import { HELPY_KUNDENAKTE_HINT } from "@/features/kundenakte/services/kundenakte-engine";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";

type VoiceNewCustomerModalProps = {
  open: boolean;
  phone: string;
  defaultName?: string | null;
  onClose: () => void;
  onCreated: (kundenakte: Kundenakte) => void;
};

export function VoiceNewCustomerModal({
  open,
  phone,
  defaultName,
  onClose,
  onCreated,
}: VoiceNewCustomerModalProps) {
  const [name, setName] = useState(defaultName?.trim() || "");
  const [telefon, setTelefon] = useState(phone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedPhone = telefon.trim();

    if (!trimmedName) {
      setError("Bitte einen Namen eingeben.");
      return;
    }

    if (trimmedPhone.length < 6) {
      setError("Bitte eine gültige Telefonnummer eingeben.");
      return;
    }

    setSaving(true);
    setError(null);

    const skillConfig = getSkillConfig("real-estate");
    const id = `voice-${trimmedPhone.replace(/\D/g, "")}`;
    const record: Kundenakte = {
      id,
      vorgangId: id,
      name: trimmedName,
      firma: "—",
      email: "—",
      telefon: trimmedPhone,
      adresse: "—",
      quelle: "HELPY Phone",
      skill: "real-estate",
      skillLabel: skillConfig.label,
      letzterKontakt: new Date().toISOString(),
      letzterKontaktLabel: new Intl.DateTimeFormat("de-CH", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
      betreff: "Neuer Kunde via Telefon",
      zusammenfassung: "Aus Telefonanruf angelegt.",
      status: "vorbereitet",
      statusLabel: KUNDENAKTE_STATUS_LABELS.vorbereitet,
      isKnownCustomer: false,
      helpyHint: HELPY_KUNDENAKTE_HINT,
    };

    upsertKundenakte(record);
    setSaving(false);
    onCreated(record);
    onClose();
  };

  return (
    <Modal open={open} title="Neuen Kunden anlegen" onClose={onClose} maxWidth="md">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
            Name
          </label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
            Telefon
          </label>
          <Input value={telefon} onChange={(event) => setTelefon(event.target.value)} />
        </div>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button disabled={saving} onClick={handleSave}>
            Kunde speichern
          </Button>
        </div>
      </div>
    </Modal>
  );
}
