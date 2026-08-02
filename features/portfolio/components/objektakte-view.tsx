"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Mail,
  MapPin,
  Pencil,
  Users,
  X,
} from "lucide-react";
import { ObjectDossierPanel } from "@/features/portfolio/components/object-dossier-panel";
import { ObjectPipelineTab } from "@/features/deals/components/object-pipeline-tab";
import { ObjectMatchesTab } from "@/features/matching/components/object-matches-tab";
import { MatchNotificationBanner } from "@/features/matching/components/match-notification-banner";
import {
  ObjectPortalPerformanceTab,
  PortalPublishModal,
  PortalPublishStatus,
} from "@/features/portal-publish";
import { openDocumentCreationForObject } from "@/features/documents/services/open-document-creation";
import { fetchPortalListing } from "@/features/portal-publish/services/portal-client-store";
import { SocialPostEditor } from "@/features/social-media/components/social-post-editor";
import { SocialPostHistory } from "@/features/social-media/components/social-post-history";
import type { SocialPost } from "@/features/social-media/types/social-media-types";
import { updatePortfolioObjectTitle } from "@/features/portfolio/services/portfolio-add-service";
import {
  resolveObjectBackNavigation,
  type ObjectNavigationOrigin,
} from "@/features/portfolio/services/object-navigation";
import {
  getObjektakteDetail,
  subscribePortfolioStores,
} from "@/features/portfolio/services/portfolio-service";
import { REAL_ESTATE_OBJECT_STATUS_LABELS } from "@/features/real-estate/object";
import { formatObjectListingPriceLabel } from "@/features/portfolio/services/object-pricing-utils";
import { ObjektDetailGallery } from "@/features/portfolio/components/objekt-detail-gallery";
import { ObjektDetailSidebar } from "@/features/portfolio/components/objekt-detail-sidebar";
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
  initialTab?: "uebersicht" | "pipeline" | "dossier" | "matches" | "performance" | "social";
};

type ObjektTab =
  | "uebersicht"
  | "pipeline"
  | "dossier"
  | "matches"
  | "performance"
  | "social";

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
            className="min-w-0 flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-[1.75rem] font-semibold tracking-[-0.035em] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-light)] sm:text-[2rem]"
          />
          <button
            type="button"
            onClick={saveTitle}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)]"
            aria-label="Titel speichern"
          >
            <Check className="size-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            aria-label="Bearbeiten abbrechen"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
        {error ? <p className="text-[12px] text-[var(--danger)]">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2">
      <h1 className="helpy-display min-w-0 text-[1.75rem] font-semibold tracking-[-0.035em] text-[var(--text-primary)] sm:text-[2rem]">
        {title}
      </h1>
      <button
        type="button"
        onClick={startEditing}
        className="mt-2 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-70 transition-all hover:bg-[var(--bg-elevated)] hover:text-[var(--accent)] hover:opacity-100 group-hover:opacity-100"
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
  const router = useRouter();
  const revision = useStoreRevision(subscribePortfolioStores);
  const [activeTab, setActiveTab] = useState<ObjektTab>(initialTab);
  const [publishOpen, setPublishOpen] = useState(false);
  const [immoscoutConfigured, setImmoscoutConfigured] = useState<boolean | null>(
    null
  );
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    void fetchPortalListing(objectId).then((data) => {
      setImmoscoutConfigured(data.config.immoscout24);
    });
  }, [objectId]);

  useEffect(() => {
    void fetch(
      `/api/social-media/generate?objekt_id=${encodeURIComponent(objectId)}`
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { posts?: SocialPost[] } | null) => {
        if (payload?.posts) setSocialPosts(payload.posts);
      })
      .catch(() => undefined);
  }, [objectId]);

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

  if (!detail) {
    return (
      <div
        className={
          embedded
            ? "flex h-full items-center justify-center px-6"
            : "rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-8 py-16 text-center"
        }
      >
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Objekt konnte nicht geladen werden.
          </p>
          {!embedded && (
            <Link
              href={backNav.href}
              className="mt-4 inline-flex text-[12px] font-semibold text-[var(--text-accent)]"
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
          ? "flex h-full min-w-0 flex-1 flex-col overflow-y-auto"
          : "mx-auto w-full max-w-6xl px-5 py-8 lg:px-8 lg:py-10"
      }
    >
      {!embedded && (
        <Link
          href={backNav.href}
          className="mb-6 inline-flex items-center gap-2 text-[12px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-accent)]"
        >
          <ArrowLeft className="size-3.5" />
          {backNav.label}
        </Link>
      )}

      <div className={embedded ? "px-5 py-5 lg:px-6" : undefined}>
      <MatchNotificationBanner
        objectId={object.objectId}
        objectTitle={object.titel}
      />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {(
          [
            { id: "uebersicht" as const, label: "Übersicht" },
            { id: "matches" as const, label: "Passende Interessenten" },
            { id: "pipeline" as const, label: "Pipeline" },
            { id: "dossier" as const, label: "Dossier" },
            { id: "performance" as const, label: "Performance" },
            { id: "social" as const, label: "📱 Social Media" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all",
              activeTab === tab.id
                ? "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--text-accent)]"
                : "border-transparent bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dossier" ? (
        <ObjectDossierPanel objectId={object.objectId} />
      ) : activeTab === "pipeline" ? (
        <ObjectPipelineTab
          objectId={object.objectId}
          dealType={object.transaktion === "Miete" ? "vermietung" : "verkauf"}
        />
      ) : activeTab === "matches" ? (
        <ObjectMatchesTab objectId={object.objectId} />
      ) : activeTab === "performance" ? (
        <ObjectPortalPerformanceTab objectId={object.objectId} />
      ) : activeTab === "social" ? (
        <SocialPostEditor
          object={object}
          initialPosts={socialPosts}
          onPostsChange={setSocialPosts}
        />
      ) : (
      <>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <ObjektDetailGallery images={detail.images} title={object.titel} />

          <div className="space-y-3">
            <ObjectTitleEditor objectId={object.objectId} title={object.titel} />
            <p className="flex items-center gap-1.5 text-[14px] text-[var(--text-secondary)]">
              <MapPin className="size-3.5 shrink-0 text-[var(--text-muted)]" />
              {object.adresse}, {object.plz} {object.ort}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {object.transaktion ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-6 rounded-full px-2.5 text-[10px] font-semibold",
                    object.transaktion === "Miete"
                      ? "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--text-accent)]"
                      : "border-[var(--warning-light)] bg-[var(--warning-light)] text-[var(--warning)]"
                  )}
                >
                  {object.transaktion}
                </Badge>
              ) : null}
              <p className="text-[32px] font-extrabold tracking-[-0.03em] text-[var(--text-primary)]">
                {listingPrice}
              </p>
            </div>
            <p className="text-[13px] text-[var(--text-muted)]">
              {REAL_ESTATE_OBJECT_STATUS_LABELS[object.status]} · {object.quelle}
            </p>
          </div>

          <SectionCard title="Details" icon={Building2}>
            <FieldGrid
              fields={[
                { label: "Zimmer", value: object.zimmer ?? "—" },
                { label: "Fläche", value: object.wohnflaeche ?? "—" },
                { label: "Etage", value: object.stockwerk ?? "—" },
                { label: "Baujahr", value: detail.baujahr },
                { label: "Verfügbar ab", value: detail.verfuegbarkeit },
                { label: "Typ", value: object.transaktion ?? "—" },
              ]}
            />
          </SectionCard>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <p className="text-[9px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase">
              Beschreibung
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              {detail.summary}
            </p>
          </div>

          <PortalPublishStatus objectId={object.objectId} />
          <SocialPostHistory posts={socialPosts} />
          <ObjectImagesSection object={object} />

          <SectionCard title="Interessenten" icon={Users}>
            {detail.interessenten.length > 0 ? (
              <ul className="space-y-2.5">
                {detail.interessenten.map((interessent) => (
                  <li
                    key={`${interessent.vorgangId}-${interessent.email}`}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                          {interessent.name}
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                          {interessent.email}
                        </p>
                        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                          {interessent.status} · {interessent.letzteAktivitaet}
                        </p>
                      </div>
                      <Link
                        href={`/kunden/akte/${encodeURIComponent(interessent.vorgangId)}`}
                        className="helpy-btn-primary inline-flex h-8 shrink-0 items-center px-3 text-[11px]"
                      >
                        Kundenakte
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--text-muted)]">
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
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3"
                  >
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {besichtigung.datum} · {besichtigung.uhrzeit}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                      {besichtigung.interessent}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                      {besichtigung.status} · {besichtigung.kalenderquelle}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--text-muted)]">
                Noch keine Besichtigungen geplant.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Kommunikation" icon={Mail}>
            {detail.kommunikation.length > 0 ? (
              <ul className="space-y-2.5">
                {detail.kommunikation.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3"
                  >
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {entry.betreff}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                      {entry.kunde} · {entry.quelle}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                      {entry.datum} · {entry.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--text-muted)]">
                Noch keine Kommunikation zu diesem Objekt.
              </p>
            )}
          </SectionCard>
        </div>

        <ObjektDetailSidebar
          detail={detail}
          object={object}
          immoscoutConfigured={immoscoutConfigured}
          onPublish={() => setPublishOpen(true)}
          onConnectImmoscout={() => router.push("/plattformen")}
          onCreateExpose={() =>
            openDocumentCreationForObject({ object, kind: "expose" })
          }
          onSocialPost={() => setActiveTab("social")}
          onOpenPipeline={() => setActiveTab("pipeline")}
        />
      </div>
      </>
      )}
      <PortalPublishModal
        object={object}
        open={publishOpen}
        onOpenChange={setPublishOpen}
      />
      </div>
    </div>
  );
}
