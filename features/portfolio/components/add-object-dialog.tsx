"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADD_OBJECT_STATUS_OPTIONS,
  type RealEstateObjectStatus,
  type RealEstateObjectTransaction,
} from "@/features/real-estate/object/object-types";
import {
  addPortfolioObject,
  type AddPortfolioObjectInput,
} from "@/features/portfolio/services/portfolio-add-service";
import { generateObjectDossier } from "@/features/real-estate/dossier/object-dossier-generator";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { getAllSkillConfig } from "@/features/workspace/services/skills/all-skills";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { cn } from "@/lib/utils";

type AddObjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: HelpySkill;
  onSaved?: (result: { objectId: string; openDossierTab?: boolean }) => void;
};

function getDialogTitle(skill: HelpySkill): string {
  const config = getAllSkillConfig(skill);
  return `${config.objekt} hinzufügen`;
}

const EMPTY_FORM: AddPortfolioObjectInput = {
  titel: "",
  adresse: "",
  plz: "",
  ort: "",
  land: "Schweiz",
  transaktion: "Miete",
  preis: "",
  zimmer: "",
  wohnflaeche: "",
  stockwerk: "",
  baujahr: "",
  verfuegbarkeit: "",
  beschreibung: "",
  status: "aktiv",
  coverPreviewUrl: null,
  coverFileName: null,
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[12px] font-semibold text-[#334155]">
      {children}
    </label>
  );
}

export function AddObjectDialog({
  open,
  onOpenChange,
  skill,
  onSaved,
}: AddObjectDialogProps) {
  const [form, setForm] = useState<AddPortfolioObjectInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"form" | "dossier-prompt">("form");
  const [createdObject, setCreatedObject] = useState<RealEstateObject | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setSaving(false);
      setStep("form");
      setCreatedObject(null);
    }
  }, [open]);

  if (!open) return null;

  const updateField = <K extends keyof AddPortfolioObjectInput>(
    key: K,
    value: AddPortfolioObjectInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      updateField("coverPreviewUrl", null);
      updateField("coverFileName", null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField("coverPreviewUrl", typeof reader.result === "string" ? reader.result : null);
      updateField("coverFileName", file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.titel.trim() || !form.adresse.trim()) return;

    setSaving(true);
    const object = addPortfolioObject(form);
    setSaving(false);
    setCreatedObject(object);
    setStep("dossier-prompt");
  };

  const finishDialog = (openDossierTab = false) => {
    if (createdObject) {
      onSaved?.({ objectId: createdObject.objectId, openDossierTab });
    }
    onOpenChange(false);
  };

  const handlePrepareDossier = () => {
    if (createdObject) {
      generateObjectDossier(createdObject.objectId);
      finishDialog(true);
      return;
    }
    finishDialog(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dialog schliessen"
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-object-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-[#CBD5E1]/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <h2
            id="add-object-title"
            className="text-[18px] font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            {getDialogTitle(skill)}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-8 items-center justify-center rounded-[10px] text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            aria-label="Schliessen"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {step === "dossier-prompt" && createdObject ? (
            <div className="space-y-5 py-4 text-center">
              <p className="text-[15px] font-semibold text-[#0F172A]">
                Objekt angelegt
              </p>
              <p className="text-[13px] leading-relaxed text-[#64748B]">
                Möchtest du ein Dossier vorbereiten? HELPY erstellt daraus
                Beschreibung, Highlights und Kontaktblock als Basis für Exposé
                und Kundenpräsentationen.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handlePrepareDossier}
                  className="h-10 rounded-[12px] bg-[#2563EB] px-4 text-[13px] font-semibold text-white"
                >
                  Dossier vorbereiten
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => finishDialog(false)}
                  className="h-10 rounded-[12px] border-[#CBD5E1]/60 px-4 text-[13px]"
                >
                  Später
                </Button>
              </div>
            </div>
          ) : (
          <>
          <div className="space-y-5">
            <div>
              <FieldLabel>Foto / Titelbild</FieldLabel>
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/80 px-4 py-6 transition-colors hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]/40",
                  form.coverPreviewUrl && "border-solid p-0"
                )}
              >
                {form.coverPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.coverPreviewUrl}
                    alt="Titelbild Vorschau"
                    className="h-40 w-full rounded-[16px] object-cover"
                  />
                ) : (
                  <>
                    <ImagePlus className="size-6 text-[#64748B]" />
                    <span className="text-[12px] font-medium text-[#64748B]">
                      Foto auswählen (optional)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel>Titel</FieldLabel>
                <Input
                  required
                  value={form.titel}
                  onChange={(event) => updateField("titel", event.target.value)}
                  placeholder="z. B. 3.5-Zimmer-Wohnung mit Balkon"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Adresse</FieldLabel>
                <Input
                  required
                  value={form.adresse}
                  onChange={(event) => updateField("adresse", event.target.value)}
                  placeholder="Strasse und Hausnummer"
                />
              </div>

              <div>
                <FieldLabel>PLZ</FieldLabel>
                <Input
                  value={form.plz}
                  onChange={(event) => updateField("plz", event.target.value)}
                  placeholder="8001"
                />
              </div>

              <div>
                <FieldLabel>Ort</FieldLabel>
                <Input
                  value={form.ort}
                  onChange={(event) => updateField("ort", event.target.value)}
                  placeholder="Zürich"
                />
              </div>

              <div>
                <FieldLabel>Land</FieldLabel>
                <Input
                  value={form.land}
                  onChange={(event) => updateField("land", event.target.value)}
                  placeholder="Schweiz"
                />
              </div>

              <div>
                <FieldLabel>Inseratstyp</FieldLabel>
                <select
                  value={form.transaktion}
                  onChange={(event) =>
                    updateField(
                      "transaktion",
                      event.target.value as RealEstateObjectTransaction
                    )
                  }
                  className="h-9 w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 text-[13px] text-[#0F172A] outline-none focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20"
                >
                  <option value="Miete">Miete</option>
                  <option value="Kauf">Kauf</option>
                </select>
              </div>

              <div>
                <FieldLabel>
                  Preis {form.transaktion === "Miete" ? "(pro Monat)" : "(Gesamtpreis)"}
                </FieldLabel>
                <Input
                  value={form.preis}
                  onChange={(event) => updateField("preis", event.target.value)}
                  placeholder={form.transaktion === "Miete" ? "2'450" : "950'000"}
                />
              </div>

              <div>
                <FieldLabel>Zimmeranzahl</FieldLabel>
                <Input
                  value={form.zimmer}
                  onChange={(event) => updateField("zimmer", event.target.value)}
                  placeholder="3.5"
                />
              </div>

              <div>
                <FieldLabel>Wohnfläche</FieldLabel>
                <Input
                  value={form.wohnflaeche}
                  onChange={(event) => updateField("wohnflaeche", event.target.value)}
                  placeholder="98 m²"
                />
              </div>

              <div>
                <FieldLabel>Stockwerk</FieldLabel>
                <Input
                  value={form.stockwerk}
                  onChange={(event) => updateField("stockwerk", event.target.value)}
                  placeholder="3. OG"
                />
              </div>

              <div>
                <FieldLabel>Baujahr</FieldLabel>
                <Input
                  value={form.baujahr}
                  onChange={(event) => updateField("baujahr", event.target.value)}
                  placeholder="1998"
                />
              </div>

              <div>
                <FieldLabel>Verfügbarkeit</FieldLabel>
                <Input
                  value={form.verfuegbarkeit}
                  onChange={(event) =>
                    updateField("verfuegbarkeit", event.target.value)
                  }
                  placeholder="Ab sofort"
                />
              </div>

              <div>
                <FieldLabel>Status</FieldLabel>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value as RealEstateObjectStatus)
                  }
                  className="h-9 w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 text-[13px] text-[#0F172A] outline-none focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20"
                >
                  {ADD_OBJECT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Beschreibung</FieldLabel>
                <textarea
                  rows={4}
                  value={form.beschreibung}
                  onChange={(event) =>
                    updateField("beschreibung", event.target.value)
                  }
                  placeholder="Kurze Beschreibung des Objekts…"
                  className="w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 py-2 text-[13px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              Objekt speichern
            </Button>
          </div>
          </>
          )}
        </form>
      </div>
    </div>
  );
}
