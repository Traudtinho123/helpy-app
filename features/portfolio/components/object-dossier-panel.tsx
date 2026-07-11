"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadProfessionalPdf } from "@/features/documents/pdf/client-actions";
import { buildDossierPayloadFromObject } from "@/features/real-estate/dossier/object-dossier-payload-builder";
import { generateObjectDossier } from "@/features/real-estate/dossier/object-dossier-generator";
import {
  confirmObjectDossier,
  getObjectDossier,
  subscribeObjectDossiers,
  upsertObjectDossier,
} from "@/features/real-estate/dossier/object-dossier-store";
import type { ObjectDossier } from "@/features/real-estate/dossier/object-dossier-types";
import { getRealEstateObjectById } from "@/features/real-estate/object/object-memory";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";
import { cn } from "@/lib/utils";

type ObjectDossierPanelProps = {
  objectId: string;
};

function AiBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-[#BFDBFE]/70 bg-[#EFF6FF] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#2563EB]">
      KI
    </span>
  );
}

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  aiGenerated = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  aiGenerated?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-[11px] font-semibold text-[#64748B]">{label}</label>
        {aiGenerated ? <AiBadge /> : null}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={6}
          className="w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#0F172A] outline-none ring-0 focus:border-[#2563EB]/40 focus:ring-2 focus:ring-[#2563EB]/10"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 py-2 text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB]/40 focus:ring-2 focus:ring-[#2563EB]/10"
        />
      )}
    </div>
  );
}

export function ObjectDossierPanel({ objectId }: ObjectDossierPanelProps) {
  const [dossier, setDossier] = useState<ObjectDossier | null>(() =>
    getObjectDossier(objectId)
  );
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeObjectDossiers(() => {
        setDossier(getObjectDossier(objectId));
      }),
    [objectId]
  );

  const handleGenerate = async () => {
    setGenerating(true);
    setFeedback(null);
    const generated = generateObjectDossier(objectId);
    setGenerating(false);
    if (!generated) {
      setFeedback("Dossier konnte nicht erzeugt werden.");
      return;
    }
    setDossier(generated);
    setFeedback("Dossier-Entwurf erstellt — bitte prüfen und speichern.");
  };

  const patchDossier = (patch: Partial<ObjectDossier>) => {
    const next = upsertObjectDossier(objectId, patch);
    setDossier(next);
  };

  const handleSave = () => {
    confirmObjectDossier(objectId);
    setDossier(getObjectDossier(objectId));
    setFeedback("Dossier gespeichert und als final markiert.");
  };

  const handleExportPdf = async () => {
    if (!dossier) return;
    const object = getRealEstateObjectById(objectId);
    if (!object) return;

    setExporting(true);
    setFeedback(null);
    try {
      const payload = buildDossierPayloadFromObject(dossier, object);
      await downloadProfessionalPdf({
        payload,
        branding: getCompanyProfileSnapshot(),
      });
      setFeedback("PDF wurde heruntergeladen.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "PDF-Export fehlgeschlagen."
      );
    } finally {
      setExporting(false);
    }
  };

  if (!dossier) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-white/80 px-8 py-14 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[16px] bg-[#EFF6FF] text-[#2563EB]">
          <FileText className="size-5" strokeWidth={2} />
        </div>
        <h2 className="mt-4 text-[18px] font-semibold text-[#0F172A]">
          Objekt-Dossier
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[#64748B]">
          HELPY erstellt aus den Objekt-Daten ein strukturiertes Dossier als
          Basis für Exposé, Angebote und Kundenpräsentationen.
        </p>
        <Button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={generating}
          className="mt-6 h-10 rounded-[12px] bg-[#2563EB] px-5 text-[13px] font-semibold text-white"
        >
          <Sparkles className="mr-2 size-4" />
          {generating ? "Wird generiert…" : "Dossier generieren"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-semibold text-[#0F172A]">Dossier</h2>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]",
                dossier.status === "final"
                  ? "bg-[#ECFDF5] text-[#047857]"
                  : "bg-[#FFFBEB] text-[#B45309]"
              )}
            >
              {dossier.status === "final" ? "Final" : "Entwurf"}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[#64748B]">
            Alle Felder sind inline bearbeitbar. Erst nach Speichern gilt das
            Dossier als final.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleGenerate()}
            disabled={generating}
            className="h-9 rounded-[12px] border-[#CBD5E1]/60 px-3 text-[12px]"
          >
            <Sparkles className="mr-1.5 size-3.5" />
            Neu generieren
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExportPdf()}
            disabled={exporting || dossier.status !== "final"}
            className="h-9 rounded-[12px] border-[#CBD5E1]/60 px-3 text-[12px]"
          >
            <Download className="mr-1.5 size-3.5" />
            {exporting ? "PDF…" : "Als PDF exportieren"}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="h-9 rounded-[12px] bg-[#2563EB] px-3 text-[12px] font-semibold text-white"
          >
            <Save className="mr-1.5 size-3.5" />
            Speichern
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)]">
        <section className="rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#2563EB]">
            Objektübersicht
          </p>
          <div className="space-y-3">
            <EditableField
              label="Bezeichnung"
              value={dossier.titel}
              onChange={(value) => patchDossier({ titel: value })}
            />
            <EditableField
              label="Typ"
              value={dossier.objectType}
              onChange={(value) => patchDossier({ objectType: value })}
            />
            <EditableField
              label="Adresse"
              value={dossier.adresse}
              onChange={(value) => patchDossier({ adresse: value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <EditableField
                label="PLZ"
                value={dossier.plz}
                onChange={(value) => patchDossier({ plz: value })}
              />
              <EditableField
                label="Ort"
                value={dossier.ort}
                onChange={(value) => patchDossier({ ort: value })}
              />
            </div>
            <EditableField
              label="Preis"
              value={dossier.preisLabel}
              onChange={(value) => patchDossier({ preisLabel: value })}
            />
            <div className="rounded-[14px] border border-[#E2E8F0]/80 bg-[#F8FAFC]/80 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#94A3B8]">
                Eckdaten
              </p>
              <ul className="space-y-2">
                {dossier.eckdaten.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="grid grid-cols-2 gap-2">
                    <input
                      value={item.label}
                      onChange={(event) => {
                        const eckdaten = [...dossier.eckdaten];
                        eckdaten[index] = { ...item, label: event.target.value };
                        patchDossier({ eckdaten });
                      }}
                      className="rounded-[8px] border border-[#E2E8F0] px-2 py-1 text-[11px]"
                    />
                    <input
                      value={item.value}
                      onChange={(event) => {
                        const eckdaten = [...dossier.eckdaten];
                        eckdaten[index] = { ...item, value: event.target.value };
                        patchDossier({ eckdaten });
                      }}
                      className="rounded-[8px] border border-[#E2E8F0] px-2 py-1 text-[11px] font-medium"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 p-5">
            <EditableField
              label="Beschreibung"
              value={dossier.description}
              onChange={(value) =>
                patchDossier({ description: value, descriptionAiGenerated: false })
              }
              multiline
              aiGenerated={dossier.descriptionAiGenerated}
            />
          </section>

          <section className="rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 p-5">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-[11px] font-semibold text-[#64748B]">Highlights</p>
              {dossier.highlightsAiGenerated ? <AiBadge /> : null}
            </div>
            <textarea
              value={dossier.highlights.join("\n")}
              onChange={(event) =>
                patchDossier({
                  highlights: event.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                  highlightsAiGenerated: false,
                })
              }
              rows={5}
              className="w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#0F172A] outline-none focus:border-[#2563EB]/40 focus:ring-2 focus:ring-[#2563EB]/10"
            />
          </section>

          <section className="rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 p-5">
            <EditableField
              label="Kontakt & Nächste Schritte"
              value={dossier.contactBlock}
              onChange={(value) =>
                patchDossier({ contactBlock: value, contactAiGenerated: false })
              }
              multiline
              aiGenerated={dossier.contactAiGenerated}
            />
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold text-[#64748B]">
                Standard-Aktionen (eine pro Zeile)
              </p>
              <textarea
                value={dossier.nextStepActions.join("\n")}
                onChange={(event) =>
                  patchDossier({
                    nextStepActions: event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  })
                }
                rows={3}
                className="w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 py-2.5 text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB]/40 focus:ring-2 focus:ring-[#2563EB]/10"
              />
            </div>
          </section>
        </div>
      </div>

      {feedback ? (
        <p className="rounded-[12px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/70 px-3 py-2 text-[12px] text-[#1D4ED8]">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
