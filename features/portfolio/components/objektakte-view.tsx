"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  FileText,
  Mail,
  Pencil,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { ObjectDossierPanel } from "@/features/portfolio/components/object-dossier-panel";
import { getDocumentDisplayStatus } from "@/features/documents/services/types";
import { REAL_ESTATE_OBJECT_STATUS_LABELS } from "@/features/real-estate/object";
import { formatObjectListingPriceLabel } from "@/features/portfolio/services/object-pricing-utils";
import { updatePortfolioObjectTitle } from "@/features/portfolio/services/portfolio-add-service";
import {
  resolveObjectBackNavigation,
  type ObjectNavigationOrigin,
} from "@/features/portfolio/services/object-navigation";
import {
  getObjektakteDetail,
  resolvePortfolioObjectImages,
  subscribePortfolioStores,
} from "@/features/portfolio/services/portfolio-service";
import { getCoverImageUrl } from "@/features/real-estate/object/object-image-utils";
import { ObjectImageCover } from "@/features/portfolio/components/object-image-cover";
import { ObjectImagesSection } from "@/features/portfolio/components/object-images-section";
import { FieldGrid, SectionCard } from "@/features/workspace/components/workspace-sections";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { cn } from "@/lib/utils";

type ObjektakteViewProps = {
  objectId: string;
  /** Inline in der Objekte-Übersicht — ohne Zurück-Link und max-width. */
  embedded?: boolean;
  /** Herkunft für kontextuelles Zurück (Vorgang / Kundenakte / Portfolio). */
  navigationOrigin?: ObjectNavigationOrigin;
  /** Beim Anlegen eines Objekts direkt den Dossier-Tab öffnen. */
  initialTab?: "uebersicht" | "dossier";
};

type ObjektTab = "uebersicht" | "dossier";

function ObjectTitleEditor({
  objectId,
  title,
}: {
  objectId: string;
  title: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(title);
      setError(null);
    }
  }, [editing, title]);

  const startEditing = () => {
    setDraft(title);
    setError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(title);
    setError(null);
    setEditing(false);
  };

  const saveTitle = () => {
    const next = draft.trim();
    if (!next) {
      setError("Titel darf nicht leer sein.");
      return;
    }

    const saved = updatePortfolioObjectTitle(objectId, next);
    if (!saved) {
      setError("Titel konnte nicht gespeichert werden.");
      return;
    }

    setEditing(false);
    setError(null);
  };

  if (editing) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveTitle();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancelEditing();
              }
            }}
            autoFocus
            aria-label="Objekttitel bearbeiten"
            className="min-w-0 flex-1 rounded-[12px] border border-[#BFDBFE] bg-white px-3 py-2 text-[1.5rem] font-semibold tracking-[-0.035em] text-[#0F172A] outline-none ring-3 ring-[#2563EB]/15 sm:text-[2rem]"
          />
          <button
            type="button"
            onClick={saveTitle}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#2563EB] text-white transition-colors hover:bg-[#1D4ED8]"
            aria-label="Titel speichern"
          >
            <Check className="size-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[#CBD5E1]/60 bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            aria-label="Bearbeiten abbrechen"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
        {error ? <p className="text-[12px] text-[#DC2626]">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2">
      <h1 className="min-w-0 text-[2rem] font-semibold tracking-[-0.035em] text-[#0F172A]">
        {title}
      </h1>
      <button
        type="button"
        onClick={startEditing}
        className="mt-2 inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[#94A3B8] opacity-70 transition-all hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:opacity-100 group-hover:opacity-100"
        aria-label="Titel bearbeiten"
      >
        <Pencil className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

export function ObjektakteView({
  objectId,
  embedded = false,
  navigationOrigin = { from: "portfolio" },
  initialTab = "uebersicht",
}: ObjektakteViewProps) {
  const revision = useStoreRevision(subscribePortfolioStores);
  const [activeTab, setActiveTab] = useState<ObjektTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [objectId, initialTab]);
  const backNav = useMemo(
    () => resolveObjectBackNavigation(navigationOrigin),
    [navigationOrigin]
  );

  const detail = useMemo(
    () => getObjektakteDetail(objectId),
    [objectId, revision]
  );

  const images = useMemo(
    () => (detail ? resolvePortfolioObjectImages(detail.object) : []),
    [detail, revision]
  );
  const coverImageUrl = useMemo(() => getCoverImageUrl(images), [images]);

  if (!detail) {
    return (
      <div
        className={
          embedded
            ? "flex h-full items-center justify-center bg-white/40 px-6"
            : "rounded-[24px] border border-dashed border-[#CBD5E1] bg-white/70 px-8 py-16 text-center backdrop-blur-xl"
        }
      >
        <div className="text-center">
          <p className="text-sm font-medium text-[#64748B]">
            Objekt konnte nicht geladen werden.
          </p>
          {!embedded && (
            <Link
              href={backNav.href}
              className="mt-4 inline-flex text-[12px] font-semibold text-[#2563EB]"
            >
              {backNav.label}
            </Link>
          )}
        </div>
      </div>
    );
  }

  const { object } = detail;
  const listingPrice = formatObjectListingPriceLabel(object.transaktion, object.preis);

  return (
    <div
      className={
        embedded
          ? "flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-white/40 backdrop-blur-sm"
          : "mx-auto max-w-3xl px-8 py-12 lg:px-12 lg:py-14"
      }
    >
      {!embedded && (
        <Link
          href={backNav.href}
          className="mb-6 inline-flex items-center gap-2 text-[12px] font-medium text-[#64748B] transition-colors hover:text-[#2563EB]"
        >
          <ArrowLeft className="size-3.5" />
          {backNav.label}
        </Link>
      )}

      <div className={embedded ? "px-6 py-6 lg:px-8" : undefined}>
      <div className="mb-5 flex gap-1.5">
        {(
          [
            { id: "uebersicht" as const, label: "Übersicht" },
            { id: "dossier" as const, label: "Dossier" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all",
              activeTab === tab.id
                ? "border-[#2563EB]/30 bg-[#EFF6FF] text-[#2563EB]"
                : "border-transparent bg-white/80 text-[#64748B] hover:bg-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dossier" ? (
        <ObjectDossierPanel objectId={object.objectId} />
      ) : (
      <>
      <section className="overflow-hidden rounded-[24px] border border-[#CBD5E1]/40 bg-white/90 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <ObjectImageCover
          coverImageUrl={coverImageUrl}
          alt={object.titel}
          variant="hero"
        />

        <div className="space-y-3 p-6">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
            Überblick
          </p>
          <ObjectTitleEditor objectId={object.objectId} title={object.titel} />
          <p className="text-[14px] text-[#64748B]">
            {object.adresse}, {object.plz} {object.ort}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {object.transaktion && (
              <Badge
                variant="outline"
                className={cn(
                  "h-6 rounded-full px-2.5 text-[10px] font-semibold",
                  object.transaktion === "Miete"
                    ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
                )}
              >
                {object.transaktion}
              </Badge>
            )}
            <p className="text-[20px] font-semibold tracking-[-0.02em] text-[#0F172A]">
              {listingPrice}
            </p>
          </div>
          <p className="text-[13px] text-[#64748B]">
            Status: {REAL_ESTATE_OBJECT_STATUS_LABELS[object.status]} · {object.quelle}
          </p>
          <div className="rounded-[14px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/45 px-3.5 py-3">
            <p className="text-[12px] leading-relaxed text-[#334155]">{detail.summary}</p>
          </div>
        </div>
      </section>

      <div className="mt-5 space-y-5">
        <SectionCard title="Eckdaten" icon={Building2}>
          <FieldGrid
            fields={[
              {
                label: "Inseratstyp",
                value: object.transaktion ?? "—",
              },
              {
                label: "Preis",
                value: listingPrice,
                highlight: true,
              },
              { label: "Zimmer", value: object.zimmer ?? "—" },
              { label: "Wohnfläche", value: object.wohnflaeche ?? "—" },
              { label: "Stockwerk", value: object.stockwerk ?? "—" },
              { label: "Baujahr", value: detail.baujahr },
              { label: "Verfügbarkeit", value: detail.verfuegbarkeit },
              { label: "Quelle", value: object.quelle },
            ]}
          />
        </SectionCard>

        <ObjectImagesSection object={object} />

        <SectionCard title="Interessenten" icon={Users}>
          {detail.interessenten.length > 0 ? (
            <ul className="space-y-2.5">
              {detail.interessenten.map((interessent) => (
                <li
                  key={`${interessent.vorgangId}-${interessent.email}`}
                  className="rounded-[14px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#0F172A]">
                        {interessent.name}
                      </p>
                      <p className="mt-1 text-[12px] text-[#64748B]">{interessent.email}</p>
                      <p className="mt-2 text-[11px] text-[#64748B]">
                        Status: {interessent.status} · Letzte Aktivität:{" "}
                        {interessent.letzteAktivitaet}
                      </p>
                    </div>
                    <Link
                      href={`/kunden/akte/${encodeURIComponent(interessent.vorgangId)}`}
                      className="inline-flex h-8 shrink-0 items-center rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                    >
                      Kundenakte öffnen
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[#64748B]">
              Noch keine Interessenten für dieses Objekt.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Besichtigungen" icon={Calendar}>
          {detail.besichtigungen.length > 0 ? (
            <ul className="space-y-2.5">
              {detail.besichtigungen.map((besichtigung) => (
                <li
                  key={besichtigung.id}
                  className="rounded-[14px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-3.5 py-3"
                >
                  <p className="text-[13px] font-semibold text-[#0F172A]">
                    {besichtigung.datum} · {besichtigung.uhrzeit}
                  </p>
                  <p className="mt-1 text-[12px] text-[#64748B]">
                    {besichtigung.interessent}
                  </p>
                  <p className="mt-2 text-[11px] text-[#64748B]">
                    Status: {besichtigung.status} · {besichtigung.kalenderquelle}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[#64748B]">
              Noch keine Besichtigungen geplant.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Dokumente" icon={FileText}>
          {detail.dokumente.length > 0 ? (
            <ul className="space-y-2.5">
              {detail.dokumente.map((document) => (
                <li
                  key={document.id}
                  className="rounded-[14px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#0F172A]">
                        {document.title}
                      </p>
                      <p className="mt-1 text-[12px] text-[#64748B]">
                        {document.typeLabel} · {getDocumentDisplayStatus(document)}
                      </p>
                    </div>
                    <Link
                      href={`/dokumente?selected=${encodeURIComponent(document.id)}`}
                      className="inline-flex h-8 shrink-0 items-center rounded-[10px] border border-[#CBD5E1]/60 bg-white px-3 text-[11px] font-semibold text-[#2563EB] transition-colors hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]"
                    >
                      Dokument öffnen
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[#64748B]">
              Noch keine Dokumente zu diesem Objekt.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Kommunikation" icon={Mail}>
          {detail.kommunikation.length > 0 ? (
            <ul className="space-y-2.5">
              {detail.kommunikation.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-[14px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-3.5 py-3"
                >
                  <p className="text-[13px] font-semibold text-[#0F172A]">
                    {entry.betreff}
                  </p>
                  <p className="mt-1 text-[12px] text-[#64748B]">
                    {entry.kunde} · {entry.quelle}
                  </p>
                  <p className="mt-2 text-[11px] text-[#64748B]">
                    {entry.datum} · Status: {entry.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[#64748B]">
              Noch keine Kommunikation zu diesem Objekt.
            </p>
          )}
        </SectionCard>

        <div className="rounded-[20px] border border-[#BFDBFE]/60 bg-gradient-to-br from-[#EFF6FF]/70 to-white/90 px-5 py-4 shadow-[0_2px_12px_rgba(37,99,235,0.06)]">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[#0F172A]">
              HELPY weiß über dieses Objekt
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            {detail.helpyWissen.map((hint) => (
              <li
                key={hint}
                className="flex gap-2 text-[12px] leading-relaxed text-[#334155]"
              >
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#2563EB]" />
                {hint}
              </li>
            ))}
          </ul>
        </div>
      </div>
      </>
      )}
      </div>
    </div>
  );
}
