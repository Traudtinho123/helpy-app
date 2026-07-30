"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { downloadProfessionalPdf } from "@/features/documents/pdf/client-actions";
import { buildExposePayloadFromObject } from "@/features/portal-publish/services/expose-from-object";
import { snapshotFromRealEstateObject } from "@/features/portal-publish/services/map-object-to-portal";
import {
  fetchPortalListing,
  publishToPortals,
} from "@/features/portal-publish/services/portal-client-store";
import type {
  PortalConfigStatus,
  PortalDurationDays,
  PortalId,
  PortalPublishResult,
} from "@/features/portal-publish/types/portal-publish-types";
import {
  PORTAL_DURATION_OPTIONS,
  PORTAL_LABELS,
} from "@/features/portal-publish/types/portal-publish-types";
import {
  getConfirmedObjectImages,
  sortObjectImages,
} from "@/features/real-estate/object/object-image-service";
import {
  getRealEstateObjectById,
  upsertRealEstateObject,
} from "@/features/real-estate/object/object-memory";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";
import { cn } from "@/lib/utils";

type PortalPublishModalProps = {
  object: RealEstateObject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: () => void;
};

export function PortalPublishModal({
  object,
  open,
  onOpenChange,
  onPublished,
}: PortalPublishModalProps) {
  const [selected, setSelected] = useState<PortalId[]>(["immoscout24"]);
  const [duration, setDuration] = useState<PortalDurationDays>(30);
  const [busy, setBusy] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PortalPublishResult[]>([]);
  const [config, setConfig] = useState<PortalConfigStatus>({
    immoscout24: false,
    homegate: false,
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    setResults([]);
    void fetchPortalListing(object.objectId).then((data) => {
      setConfig(data.config);
    });
  }, [open, object.objectId]);

  const images = useMemo(
    () => sortObjectImages(getConfirmedObjectImages(object.objectId)),
    [object]
  );

  const previewLines = useMemo(() => {
    const lines = [
      object.titel,
      `${object.adresse}, ${object.plz} ${object.ort}`,
      object.transaktion === "Miete"
        ? `Miete: ${object.preis ?? "auf Anfrage"}`
        : `Kaufpreis: ${object.preis ?? "auf Anfrage"}`,
    ];
    if (object.zimmer) lines.push(`${object.zimmer} Zimmer`);
    if (object.wohnflaeche) lines.push(object.wohnflaeche);
    if (object.verfuegbarkeit) {
      lines.push(`Verfügbar ab: ${object.verfuegbarkeit}`);
    }
    lines.push(`${images.length} Bild${images.length === 1 ? "" : "er"}`);
    return lines;
  }, [object, images.length]);

  const togglePortal = (portal: PortalId) => {
    if (portal === "comparis") return;
    setSelected((current) =>
      current.includes(portal)
        ? current.filter((item) => item !== portal)
        : [...current, portal]
    );
  };

  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    setError(null);
    try {
      const payload = buildExposePayloadFromObject(object);
      await downloadProfessionalPdf({
        payload,
        branding: getCompanyProfileSnapshot(),
        fileName: `Expose-${object.titel.replace(/\s+/g, "-")}.pdf`,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "PDF-Export fehlgeschlagen."
      );
    } finally {
      setExportingPdf(false);
    }
  }, [object]);

  const handlePublish = useCallback(async () => {
    if (selected.length === 0) {
      setError("Bitte mindestens ein Portal auswählen.");
      return;
    }

    setBusy(true);
    setError(null);
    setResults([]);

    const snapshot = snapshotFromRealEstateObject({
      objectId: object.objectId,
      titel: object.titel,
      beschreibung: object.beschreibung,
      preis: object.preis,
      transaktion: object.transaktion,
      zimmer: object.zimmer,
      wohnflaeche: object.wohnflaeche,
      adresse: object.adresse,
      plz: object.plz,
      ort: object.ort,
      land: object.land,
      verfuegbarkeit: object.verfuegbarkeit,
      stockwerk: object.stockwerk,
      baujahr: object.baujahr,
      imageUrls: images.map((image) => image.url),
    });

    const response = await publishToPortals({
      objektId: object.objectId,
      portals: selected,
      durationDays: duration,
      objectSnapshot: snapshot,
    });

    setBusy(false);
    setConfig(response.config);
    setResults(response.results);

    if (response.error) {
      setError(response.error);
      return;
    }

    const notConfigured = response.results.filter((item) => !item.configured);
    const failed = response.results.filter(
      (item) => item.configured && !item.success
    );
    const succeeded = response.results.filter((item) => item.success);

    if (succeeded.length > 0) {
      const liveObject = getRealEstateObjectById(object.objectId);
      if (liveObject) {
        const primaryUrl =
          succeeded.find((item) => item.portal === "immoscout24")?.listingUrl ??
          succeeded[0]?.listingUrl ??
          liveObject.objektLink;
        upsertRealEstateObject({
          ...liveObject,
          objektLink: primaryUrl,
          status: liveObject.status === "entwurf" ? "aktiv" : liveObject.status,
          aktiv: true,
          updatedAt: new Date().toISOString(),
        });
      }
      onPublished?.();
    }

    if (notConfigured.length > 0 && succeeded.length === 0) {
      setError(
        "API nicht konfiguriert — bitte API-Keys setzen oder Exposé-PDF für manuellen Upload nutzen."
      );
    } else if (failed.length > 0 && succeeded.length === 0) {
      setError(
        failed.map((item) => item.error).filter(Boolean).join(" · ") ||
          "Publizieren fehlgeschlagen."
      );
    } else if (succeeded.length > 0 && (failed.length > 0 || notConfigured.length > 0)) {
      setError(
        "Teilweise publiziert — siehe Details unten. Für fehlende Portale Exposé-PDF nutzen."
      );
    } else if (succeeded.length > 0) {
      onOpenChange(false);
    }
  }, [selected, duration, object, images, onOpenChange, onPublished]);

  const needsPdfFallback =
    (!config.immoscout24 && selected.includes("immoscout24")) ||
    (!config.homegate && selected.includes("homegate")) ||
    results.some((item) => !item.configured || !item.success);

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Auf Portalen publizieren"
      description="Inserat auf ImmoScout24.ch und Homegate.ch veröffentlichen."
      maxWidth="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExportPdf()}
            disabled={exportingPdf}
            className="h-9 rounded-[12px] text-[12px]"
          >
            <Download className="mr-1.5 size-3.5" />
            {exportingPdf ? "PDF…" : "Exposé-PDF herunterladen"}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-[12px] text-[12px]"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={() => void handlePublish()}
              disabled={busy || selected.length === 0}
              className="h-9 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Publiziert…
                </>
              ) : (
                <>
                  <Radio className="mr-1.5 size-3.5" />
                  Publizieren
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.04em] text-[#64748B] uppercase">
            Portale
          </p>
          <div className="space-y-2">
            {(
              [
                { id: "immoscout24" as const, enabled: true },
                { id: "homegate" as const, enabled: true },
                { id: "comparis" as const, enabled: false },
              ] as const
            ).map((portal) => {
              const checked = selected.includes(portal.id);
              const configured =
                portal.id === "comparis"
                  ? false
                  : config[portal.id as "immoscout24" | "homegate"];

              return (
                <label
                  key={portal.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-[14px] border px-3.5 py-3",
                    portal.enabled
                      ? "cursor-pointer border-[#E2E8F0]/70 bg-white"
                      : "cursor-not-allowed border-[#E2E8F0]/50 bg-[#F8FAFC] opacity-70"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!portal.enabled}
                      onChange={() => togglePortal(portal.id)}
                      className="size-4 rounded border-[#CBD5E1]"
                    />
                    <span className="text-[13px] font-semibold text-[#0F172A]">
                      {PORTAL_LABELS[portal.id]}
                      {!portal.enabled ? " (bald)" : ""}
                    </span>
                  </span>
                  {portal.enabled ? (
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        configured ? "text-[#047857]" : "text-[#B45309]"
                      )}
                    >
                      {configured ? "API bereit" : "API nicht konfiguriert"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[#94A3B8]">
                      bald
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.04em] text-[#64748B] uppercase">
            Laufzeit
          </p>
          <div className="flex flex-wrap gap-2">
            {PORTAL_DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDuration(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all",
                  duration === option.value
                    ? "border-[#2563EB]/30 bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/40 px-3.5 py-3">
          <p className="text-[11px] font-semibold tracking-[0.04em] text-[#2563EB] uppercase">
            Exposé-Vorschau
          </p>
          <ul className="mt-2 space-y-1">
            {previewLines.map((line) => (
              <li key={line} className="text-[12px] text-[#334155]">
                {line}
              </li>
            ))}
          </ul>
          {object.beschreibung ? (
            <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-[#64748B]">
              {object.beschreibung}
            </p>
          ) : null}
        </div>

        {needsPdfFallback ? (
          <div className="rounded-[14px] border border-[#FDE68A]/70 bg-[#FFFBEB]/70 px-3.5 py-3 text-[12px] text-[#92400E]">
            Ohne konfigurierte API-Keys wird nicht live publiziert. Nutze das
            Exposé-PDF für den manuellen Upload auf dem Portal.
          </div>
        ) : null}

        {results.length > 0 ? (
          <ul className="space-y-2">
            {results.map((result) => (
              <li
                key={result.portal}
                className="rounded-[12px] border border-[#E2E8F0]/70 bg-[#F8FAFC] px-3 py-2 text-[12px]"
              >
                <span className="font-semibold text-[#0F172A]">
                  {PORTAL_LABELS[result.portal]}:{" "}
                </span>
                {result.success ? (
                  <span className="text-[#047857]">Live</span>
                ) : (
                  <span className="text-[#B45309]">
                    {result.error ?? "Fehlgeschlagen"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="text-[12px] text-[#DC2626]">{error}</p> : null}
      </div>
    </Modal>
  );
}
