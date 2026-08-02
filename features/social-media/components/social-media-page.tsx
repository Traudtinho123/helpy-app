"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SocialPostEditor } from "@/features/social-media/components/social-post-editor";
import { getRealEstateObjectById } from "@/features/real-estate/object/object-memory";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { subscribeRealEstateObjects } from "@/features/real-estate/object/object-memory";
import { getAllRealEstateObjects } from "@/features/real-estate/object/object-memory";

function SocialMediaContent() {
  const searchParams = useSearchParams();
  const objektId = searchParams.get("objektId")?.trim() ?? "";
  const revision = useStoreRevision(subscribeRealEstateObjects);

  const object = useMemo(
    () => (objektId ? getRealEstateObjectById(objektId) : null),
    [objektId, revision]
  );

  const activeObjects = useMemo(
    () =>
      getAllRealEstateObjects().filter(
        (item) => item.status === "aktiv" || item.aktiv
      ),
    [revision]
  );

  return (
    <DashboardShell activeHref="/social-media">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <Link
            href="/objekte"
            className="mb-4 inline-flex items-center gap-2 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            <ArrowLeft className="size-3.5" />
            Zurück zu Objekten
          </Link>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">📱 Social Media</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            HELPY bereitet Posts vor — du prüfst und veröffentlichst manuell.
          </p>
        </div>

        {!objektId ? (
          <div className="space-y-3">
            <p className="text-[13px] text-[var(--text-secondary)]">
              Wähle ein aktives Objekt:
            </p>
            {activeObjects.length === 0 ? (
              <p className="text-[13px] text-[var(--text-secondary)]">
                Keine aktiven Objekte — setze zuerst ein Objekt auf «Aktiv».
              </p>
            ) : (
              activeObjects.map((item) => (
                <Link
                  key={item.objectId}
                  href={`/social-media?objektId=${encodeURIComponent(item.objectId)}`}
                  className="block rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-[13px] font-medium text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)]"
                >
                  {item.titel} · {item.adresse}, {item.ort}
                </Link>
              ))
            )}
          </div>
        ) : !object ? (
          <p className="text-[13px] text-[var(--text-secondary)]">Objekt nicht gefunden.</p>
        ) : (
          <SocialPostEditor object={object} />
        )}
      </div>
    </DashboardShell>
  );
}

export function SocialMediaPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell activeHref="/social-media">
          <div className="px-6 py-8 text-[13px] text-[var(--text-secondary)]">Laden …</div>
        </DashboardShell>
      }
    >
      <SocialMediaContent />
    </Suspense>
  );
}
