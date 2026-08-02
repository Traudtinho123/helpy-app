"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { patchVorgangLinks } from "@/features/vorgaenge/services/vorgang-link-service";

type CreateKundeMiniModalProps = {
  open: boolean;
  onClose: () => void;
  vorgangId: string;
  defaultName: string;
  defaultEmail: string;
  defaultNote?: string;
  onSaved: (customerId: string) => void;
};

function splitName(fullName: string): { vorname: string; nachname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { vorname: "Kontakt", nachname: "Neu" };
  if (parts.length === 1) return { vorname: parts[0]!, nachname: "—" };
  return {
    vorname: parts.slice(0, -1).join(" "),
    nachname: parts[parts.length - 1]!,
  };
}

export function CreateKundeMiniModal({
  open,
  onClose,
  vorgangId,
  defaultName,
  defaultEmail,
  defaultNote = "",
  onSaved,
}: CreateKundeMiniModalProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [telefon, setTelefon] = useState("");
  const [notiz, setNotiz] = useState(defaultNote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const { vorname, nachname } = splitName(name);
    const response = await fetch("/api/kunden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vorname,
        nachname,
        email: email.trim() || null,
        telefon: telefon.trim() || null,
        notizen: notiz.trim() || null,
        status: "interessent",
      }),
    });

    const payload = (await response.json()) as {
      customer?: { id: string };
      error?: string;
    };

    if (!response.ok || !payload.customer?.id) {
      setError(payload.error ?? "Kunde konnte nicht angelegt werden.");
      setLoading(false);
      return;
    }

    await patchVorgangLinks({
      vorgangId,
      kundenId: payload.customer.id,
    });

    onSaved(payload.customer.id);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Neuen Kunden anlegen">
      <div className="space-y-4 p-1">
        <div>
          <label className="mb-1 block text-[12px] font-medium text-[#64748B]">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-[#64748B]">E-Mail</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-[#64748B]">Telefon</label>
          <Input value={telefon} onChange={(e) => setTelefon(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-[#64748B]">Notiz</label>
          <Textarea value={notiz} onChange={(e) => setNotiz(e.target.value)} rows={3} />
        </div>
        {error ? (
          <p className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#DC2626]">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          className="w-full"
          disabled={loading}
          onClick={() => void handleSave()}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Speichern…
            </>
          ) : (
            "Speichern & verknüpfen"
          )}
        </Button>
      </div>
    </Modal>
  );
}
