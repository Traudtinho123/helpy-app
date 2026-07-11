"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { Customer } from "@/features/customers/mock/mock-customers";
import { createVorgangClient } from "@/features/vorgaenge/services/create-vorgang-client";
import type {
  CreateVorgangPriority,
  CreateVorgangStatus,
} from "@/features/vorgaenge/types/create-vorgang-types";
import { getAllRealEstateObjects } from "@/features/real-estate/object/object-memory";

type CreateVorgangModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
  customers: Customer[];
};

const PRIORITY_OPTIONS: Array<{ value: CreateVorgangPriority; label: string }> =
  [
    { value: "kritisch", label: "Kritisch" },
    { value: "hoch", label: "Hoch" },
    { value: "normal", label: "Normal" },
    { value: "niedrig", label: "Niedrig" },
  ];

const STATUS_OPTIONS: Array<{ value: CreateVorgangStatus; label: string }> = [
  { value: "neu", label: "Neu" },
  { value: "in_bearbeitung", label: "In Bearbeitung" },
  { value: "warten_auf_antwort", label: "Warten auf Antwort" },
];

export function CreateVorgangModal({
  open,
  onClose,
  onCreated,
  customers,
}: CreateVorgangModalProps) {
  const [titel, setTitel] = useState("");
  const [inhalt, setInhalt] = useState("");
  const [prioritaet, setPrioritaet] = useState<CreateVorgangPriority>("normal");
  const [status, setStatus] = useState<CreateVorgangStatus>("neu");
  const [kundenId, setKundenId] = useState("");
  const [objektId, setObjektId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [objectQuery, setObjectQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const objects = useMemo(() => getAllRealEstateObjects(), [open]);

  useEffect(() => {
    if (!open) return;
    setTitel("");
    setInhalt("");
    setPrioritaet("normal");
    setStatus("neu");
    setKundenId("");
    setObjektId("");
    setCustomerQuery("");
    setObjectQuery("");
    setError(null);
    setLoading(false);
  }, [open]);

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) return customers.slice(0, 8);
    return customers
      .filter((customer) => {
        const haystack = [
          customer.contactPerson,
          customer.company,
          customer.email,
          customer.phone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [customerQuery, customers]);

  const filteredObjects = useMemo(() => {
    const query = objectQuery.trim().toLowerCase();
    if (!query) return objects.slice(0, 8);
    return objects
      .filter((object) => {
        const haystack = [object.titel, object.adresse, object.ort]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [objectQuery, objects]);

  const handleSubmit = useCallback(async () => {
    if (!titel.trim()) {
      setError("Bitte einen Titel eingeben.");
      return;
    }
    if (!inhalt.trim()) {
      setError("Bitte eine Beschreibung eingeben.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createVorgangClient({
      source: "manuell",
      titel: titel.trim(),
      inhalt: inhalt.trim(),
      prioritaet,
      status,
      kunden_id: kundenId || null,
      objekt_id: objektId || null,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onCreated("✓ Vorgang wurde erstellt.");
    onClose();
  }, [inhalt, kundenId, objektId, onClose, onCreated, prioritaet, status, titel]);

  return (
    <Modal open={open} title="Neuen Vorgang erstellen" onClose={onClose} maxWidth="lg">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">
            Titel *
          </label>
          <Input
            value={titel}
            onChange={(event) => setTitel(event.target.value)}
            placeholder="z. B. Rückruf Wohnungsinteressent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">
            Beschreibung *
          </label>
          <Textarea
            value={inhalt}
            onChange={(event) => setInhalt(event.target.value)}
            placeholder="Was ist zu tun?"
            rows={4}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">
              Priorität
            </label>
            <Select
              value={prioritaet}
              onChange={(event) =>
                setPrioritaet(event.target.value as CreateVorgangPriority)
              }
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">
              Status
            </label>
            <Select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CreateVorgangStatus)
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">
            Kunde verknüpfen
          </label>
          <Input
            value={customerQuery}
            onChange={(event) => setCustomerQuery(event.target.value)}
            placeholder="Kunde suchen…"
          />
          {filteredCustomers.length > 0 ? (
            <ul className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-[#E2E8F0]">
              {filteredCustomers.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setKundenId(customer.id);
                      setCustomerQuery(customer.contactPerson);
                    }}
                    className={cnCustomerButton(kundenId === customer.id)}
                  >
                    {customer.contactPerson}
                    {customer.company ? ` · ${customer.company}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">
            Objekt verknüpfen
          </label>
          <Input
            value={objectQuery}
            onChange={(event) => setObjectQuery(event.target.value)}
            placeholder="Objekt suchen…"
          />
          {filteredObjects.length > 0 ? (
            <ul className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-[#E2E8F0]">
              {filteredObjects.map((object) => (
                <li key={object.objectId}>
                  <button
                    type="button"
                    onClick={() => {
                      setObjektId(object.objectId);
                      setObjectQuery(object.titel);
                    }}
                    className={cnCustomerButton(objektId === object.objectId)}
                  >
                    {object.titel}
                    {object.adresse ? ` · ${object.adresse}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <p className="text-[12px] text-[#64748B]">Quelle: Manuell</p>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Speichern…
              </>
            ) : (
              "Vorgang speichern"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function cnCustomerButton(active: boolean): string {
  return [
    "block w-full px-3 py-2 text-left text-[13px] transition-colors",
    active
      ? "bg-[#EFF6FF] font-semibold text-[#2563EB]"
      : "text-[#0F172A] hover:bg-[#F8FAFC]",
  ].join(" ");
}
