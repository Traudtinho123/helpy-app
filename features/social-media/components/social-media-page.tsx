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
            className="mb-4 inline-flex items-center gap-2 text-[12px] font-medium text-[#64748B] hover:text-[#2563EB]"
          >
            <ArrowLeft className="size-3.5" />
            Zurück zu Objekten
          </Link>
          <h1 className="text-[22px] font-bold text-[#0F172A]">📱 Social Media</h1>
          <p className="mt-1 text-[13px] text-[#64748B]">
            HELPY bereitet Posts vor — du prüfst und veröffentlichst manuell.
          </p>
        </div>

        {!objektId ? (
          <div className="space-y-3">
            <p className="text-[13px] text-[#64748B]">
              Wähle ein aktives Objekt:
            </p>
            {activeObjects.length === 0 ? (
              <p className="text-[13px] text-[#64748B]">
                Keine aktiven Objekte — setze zuerst ein Objekt auf «Aktiv».
              </p>
            ) : (
              activeObjects.map((item) => (
                <Link
                  key={item.objectId}
                  href={`/social-media?objektId=${encodeURIComponent(item.objectId)}`}
                  className="block rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3 text-[13px] font-medium text-[#334155] hover:border-[#2563EB]/30 hover:bg-[#EFF6FF]"
                >
                  {item.titel} · {item.adresse}, {item.ort}
                </Link>
              ))
            )}
          </div>
        ) : !object ? (
          <p className="text-[13px] text-[#64748B]">Objekt nicht gefunden.</p>
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
          <div className="px-6 py-8 text-[13px] text-[#64748B]">Laden …</div>
        </DashboardShell>
      }
    >
      <SocialMediaContent />
    </Suspense>
  );
}
