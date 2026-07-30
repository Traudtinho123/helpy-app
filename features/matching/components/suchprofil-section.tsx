"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  SuchprofilArt,
  SuchprofilRecord,
} from "@/features/matching/types/matching-types";
import {
  LAGE_SUGGESTIONS,
  OBJEKTTYP_OPTIONS,
} from "@/features/matching/types/matching-types";
import {
  fetchSuchprofile,
  getSuchprofilForKunde,
  saveSuchprofil,
  subscribeMatchingStore,
} from "@/features/matching/services/match-client-store";
import { cn } from "@/lib/utils";

type SuchprofilSectionProps = {
  kundeId: string;
  kundeName?: string;
  initialEditing?: boolean;
};

type FormState = {
  art: SuchprofilArt;
  objekttyp: string[];
  zimmer_min: string;
  zimmer_max: string;
  flaeche_min: string;
  flaeche_max: string;
  preis_max: string;
  lagen: string[];
  muss_kriterien: string[];
  notizen: string;
  aktiv: boolean;
};

function recordToForm(record: SuchprofilRecord | null): FormState {
  return {
    art: record?.art ?? "mieten",
    objekttyp: record?.objekttyp ?? [],
    zimmer_min: record?.zimmer_min?.toString() ?? "",
    zimmer_max: record?.zimmer_max?.toString() ?? "",
    flaeche_min: record?.flaeche_min?.toString() ?? "",
    flaeche_max: record?.flaeche_max?.toString() ?? "",
    preis_max: record?.preis_max?.toString() ?? "",
    lagen: record?.lagen ?? [],
    muss_kriterien: record?.muss_kriterien ?? [],
    notizen: record?.notizen ?? "",
    aktiv: record?.aktiv ?? true,
  };
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function SuchprofilSection({ kundeId, kundeName, initialEditing = false }: SuchprofilSectionProps) {
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(initialEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() => recordToForm(null));
  const [lageInput, setLageInput] = useState("");
  const [kriteriumInput, setKriteriumInput] = useState("");

  useEffect(() => {
    setEditing(initialEditing);
  }, [initialEditing]);
  useEffect(() => subscribeMatchingStore(() => setRevision((r) => r + 1)), []);
  useEffect(() => {
    void fetchSuchprofile({ kunde_id: kundeId });
  }, [kundeId]);

  const profil = useMemo(
    () => getSuchprofilForKunde(kundeId),
    [kundeId, revision]
  );

  useEffect(() => {
    if (!editing) {
      setForm(recordToForm(profil));
    }
  }, [profil, editing]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveSuchprofil({
      id: profil?.id,
      kunde_id: kundeId,
      art: form.art,
      objekttyp: form.objekttyp,
      zimmer_min: parseOptionalNumber(form.zimmer_min),
      zimmer_max: parseOptionalNumber(form.zimmer_max),
      flaeche_min: parseOptionalNumber(form.flaeche_min),
      flaeche_max: parseOptionalNumber(form.flaeche_max),
      preis_max: parseOptionalNumber(form.preis_max),
      lagen: form.lagen,
      muss_kriterien: form.muss_kriterien,
      notizen: form.notizen || null,
      aktiv: form.aktiv,
    });
    setSaving(false);
    setEditing(false);
  }, [form, kundeId, profil?.id]);

  const toggleObjekttyp = (typ: string) => {
    setForm((prev) => ({
      ...prev,
      objekttyp: prev.objekttyp.includes(typ)
        ? prev.objekttyp.filter((item) => item !== typ)
        : [...prev.objekttyp, typ],
    }));
  };

  const addLage = (lage: string) => {
    const trimmed = lage.trim();
    if (!trimmed || form.lagen.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, lagen: [...prev.lagen, trimmed] }));
    setLageInput("");
  };

  const addKriterium = () => {
    const trimmed = kriteriumInput.trim();
    if (!trimmed || form.muss_kriterien.includes(trimmed)) return;
    setForm((prev) => ({
      ...prev,
      muss_kriterien: [...prev.muss_kriterien, trimmed],
    }));
    setKriteriumInput("");
  };

  return (
    <section className="rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#2563EB]">
            <Search className="size-4" strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-[14px] font-semibold text-[#0F172A]">
              🔍 Suchprofil
            </h3>
            <p className="text-[11px] text-[#64748B]">
              {kundeName ? `Suchkriterien für ${kundeName}` : "Automatisches Objekt-Matching"}
            </p>
          </div>
        </div>
        {!editing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditing(true)}
            className="h-8 rounded-[10px] border-[#CBD5E1]/60 px-3 text-[11px]"
          >
            <Pencil className="mr-1.5 size-3" />
            {profil ? "Bearbeiten" : "Anlegen"}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["mieten", "kaufen"] as const).map((art) => (
              <button
                key={art}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, art }))}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-semibold capitalize transition-all",
                  form.art === art
                    ? "border-[#2563EB]/30 bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#CBD5E1]/60 bg-white text-[#64748B]"
                )}
              >
                {art}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Objekttyp
            </p>
            <div className="flex flex-wrap gap-1.5">
              {OBJEKTTYP_OPTIONS.map((typ) => (
                <button
                  key={typ}
                  type="button"
                  onClick={() => toggleObjekttyp(typ)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-all",
                    form.objekttyp.includes(typ)
                      ? "border-[#2563EB]/30 bg-[#EFF6FF] text-[#2563EB]"
                      : "border-[#CBD5E1]/60 text-[#64748B]"
                  )}
                >
                  {typ}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldPair
              label="Zimmer min/max"
              min={form.zimmer_min}
              max={form.zimmer_max}
              onMinChange={(v) => setForm((prev) => ({ ...prev, zimmer_min: v }))}
              onMaxChange={(v) => setForm((prev) => ({ ...prev, zimmer_max: v }))}
            />
            <FieldPair
              label="Fläche min/max (m²)"
              min={form.flaeche_min}
              max={form.flaeche_max}
              onMinChange={(v) => setForm((prev) => ({ ...prev, flaeche_min: v }))}
              onMaxChange={(v) => setForm((prev) => ({ ...prev, flaeche_max: v }))}
            />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Preis max (CHF)
            </p>
            <input
              value={form.preis_max}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, preis_max: e.target.value }))
              }
              placeholder="z.B. 800000"
              className="w-full rounded-[10px] border border-[#CBD5E1]/60 px-3 py-2 text-[12px]"
            />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Lagen
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {form.lagen.map((lage) => (
                <Badge
                  key={lage}
                  variant="outline"
                  className="gap-1 rounded-full border-[#BFDBFE]/60 bg-[#EFF6FF]/80 px-2 text-[10px]"
                >
                  {lage}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        lagen: prev.lagen.filter((item) => item !== lage),
                      }))
                    }
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={lageInput}
                onChange={(e) => setLageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLage(lageInput);
                  }
                }}
                placeholder="Ort hinzufügen…"
                className="min-w-0 flex-1 rounded-[10px] border border-[#CBD5E1]/60 px-3 py-2 text-[12px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addLage(lageInput)}
                className="h-9 shrink-0 rounded-[10px] px-3 text-[11px]"
              >
                +
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {LAGE_SUGGESTIONS.filter((s) => !form.lagen.includes(s)).map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addLage(suggestion)}
                    className="rounded-full border border-dashed border-[#CBD5E1]/60 px-2 py-0.5 text-[10px] text-[#64748B] hover:border-[#2563EB]/30 hover:text-[#2563EB]"
                  >
                    + {suggestion}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Muss-Kriterien
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {form.muss_kriterien.map((kriterium) => (
                <Badge
                  key={kriterium}
                  variant="outline"
                  className="gap-1 rounded-full px-2 text-[10px]"
                >
                  {kriterium}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        muss_kriterien: prev.muss_kriterien.filter(
                          (item) => item !== kriterium
                        ),
                      }))
                    }
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={kriteriumInput}
                onChange={(e) => setKriteriumInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKriterium();
                  }
                }}
                placeholder="z.B. Balkon, Garage…"
                className="min-w-0 flex-1 rounded-[10px] border border-[#CBD5E1]/60 px-3 py-2 text-[12px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addKriterium}
                className="h-9 shrink-0 rounded-[10px] px-3 text-[11px]"
              >
                +
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Notizen
            </p>
            <textarea
              value={form.notizen}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notizen: e.target.value }))
              }
              rows={2}
              className="w-full rounded-[10px] border border-[#CBD5E1]/60 px-3 py-2 text-[12px]"
            />
          </div>

          <label className="flex items-center gap-2 text-[12px] text-[#334155]">
            <input
              type="checkbox"
              checked={form.aktiv}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, aktiv: e.target.checked }))
              }
              className="rounded"
            />
            Suchprofil aktiv (Matching eingeschaltet)
          </label>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="h-9 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white"
            >
              <Check className="mr-1.5 size-3.5" />
              {saving ? "Speichern…" : "Speichern"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setForm(recordToForm(profil));
              }}
              className="h-9 rounded-[12px] px-4 text-[12px]"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      ) : profil ? (
        <SuchprofilSummary profil={profil} />
      ) : (
        <p className="text-[13px] text-[#64748B]">
          Noch kein Suchprofil hinterlegt. HELPY kann Kriterien aus E-Mails
          vorschlagen oder du legst sie manuell an.
        </p>
      )}
    </section>
  );
}

function SuchprofilSummary({ profil }: { profil: SuchprofilRecord }) {
  return (
    <div className="space-y-2 text-[12px] text-[#334155]">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full text-[10px] capitalize">
          {profil.art}
        </Badge>
        {profil.aktiv ? (
          <Badge className="rounded-full bg-[#ECFDF5] text-[10px] text-[#047857]">
            Aktiv
          </Badge>
        ) : (
          <Badge variant="outline" className="rounded-full text-[10px]">
            Inaktiv
          </Badge>
        )}
        {profil.auto_erkannt && (
          <Badge variant="outline" className="rounded-full text-[10px] text-[#6D28D9]">
            Auto-erkannt
          </Badge>
        )}
      </div>
      <SummaryRow
        label="Zimmer"
        value={
          profil.zimmer_min || profil.zimmer_max
            ? `${profil.zimmer_min ?? "?"} – ${profil.zimmer_max ?? "?"}`
            : "—"
        }
      />
      <SummaryRow
        label="Preis max"
        value={
          profil.preis_max
            ? `CHF ${profil.preis_max.toLocaleString("de-CH")}`
            : "—"
        }
      />
      <SummaryRow
        label="Lagen"
        value={profil.lagen.length ? profil.lagen.join(", ") : "—"}
      />
      {profil.objekttyp.length > 0 && (
        <SummaryRow label="Typ" value={profil.objekttyp.join(", ")} />
      )}
      {profil.muss_kriterien.length > 0 && (
        <SummaryRow label="Muss" value={profil.muss_kriterien.join(", ")} />
      )}
      {profil.notizen && (
        <p className="mt-2 text-[11px] italic text-[#64748B]">{profil.notizen}</p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 text-[#94A3B8]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function FieldPair({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
        {label}
      </p>
      <div className="flex gap-2">
        <input
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder="Min"
          className="w-full rounded-[10px] border border-[#CBD5E1]/60 px-3 py-2 text-[12px]"
        />
        <input
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder="Max"
          className="w-full rounded-[10px] border border-[#CBD5E1]/60 px-3 py-2 text-[12px]"
        />
      </div>
    </div>
  );
}
