"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { createKundeCustomer } from "@/features/customers/services/kunden-client";
import type { Customer } from "@/features/customers/mock/mock-customers";
import type {
  CreateKundeInput,
  KundeDbStatus,
} from "@/features/customers/types/kunden-db-types";

export type CreateCustomerFormDefaults = Partial<CreateKundeInput>;

type CreateCustomerFormProps = {
  defaults?: CreateCustomerFormDefaults;
  onSuccess: (customer: Customer) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

const STATUS_OPTIONS: Array<{ value: KundeDbStatus; label: string }> = [
  { value: "interessent", label: "Interessent" },
  { value: "aktiv", label: "Aktiv" },
  { value: "bestandskunde", label: "Bestandskunde" },
];

export function CreateCustomerForm({
  defaults,
  onSuccess,
  onCancel,
  submitLabel = "Kunde speichern",
}: CreateCustomerFormProps) {
  const [vorname, setVorname] = useState(defaults?.vorname ?? "");
  const [nachname, setNachname] = useState(defaults?.nachname ?? "");
  const [firma, setFirma] = useState(defaults?.firma ?? "");
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [telefon, setTelefon] = useState(defaults?.telefon ?? "");
  const [adresse, setAdresse] = useState(defaults?.adresse ?? "");
  const [notizen, setNotizen] = useState(defaults?.notizen ?? "");
  const [status, setStatus] = useState<KundeDbStatus>(
    defaults?.status ?? "interessent"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!vorname.trim() || !nachname.trim()) {
      setError("Vorname und Nachname sind Pflichtfelder.");
      return;
    }

    setSaving(true);
    setError(null);
    setDuplicateId(null);

    const result = await createKundeCustomer({
      vorname: vorname.trim(),
      nachname: nachname.trim(),
      firma: firma.trim() || null,
      email: email.trim() || null,
      telefon: telefon.trim() || null,
      adresse: adresse.trim() || null,
      notizen: notizen.trim() || null,
      status,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      setDuplicateId(result.duplicateId ?? null);
      return;
    }

    onSuccess(result.customer);
  }, [
    adresse,
    email,
    firma,
    nachname,
    notizen,
    onSuccess,
    status,
    telefon,
    vorname,
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
            Vorname *
          </label>
          <Input
            value={vorname}
            onChange={(event) => setVorname(event.target.value)}
            placeholder="Max"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
            Nachname *
          </label>
          <Input
            value={nachname}
            onChange={(event) => setNachname(event.target.value)}
            placeholder="Müller"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
          Firma / Unternehmen
        </label>
        <Input
          value={firma}
          onChange={(event) => setFirma(event.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
            E-Mail
          </label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="max@beispiel.ch"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
            Telefonnummer
          </label>
          <Input
            value={telefon}
            onChange={(event) => setTelefon(event.target.value)}
            placeholder="+41 79 123 45 67"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
          Adresse
        </label>
        <Input
          value={adresse}
          onChange={(event) => setAdresse(event.target.value)}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
          Notizen
        </label>
        <Textarea
          value={notizen}
          onChange={(event) => setNotizen(event.target.value)}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-semibold text-[var(--text-secondary)]">
          Status
        </label>
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as KundeDbStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          {error}
          {duplicateId ? (
            <p className="mt-1 text-[12px]">
              Bestehender Kunde — öffne die Kundenakte statt einen Duplikat anzulegen.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Abbrechen
          </Button>
        ) : null}
        <Button
          disabled={saving}
          className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:opacity-95"
          onClick={() => void handleSubmit()}
        >
          {saving ? "Speichern…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
