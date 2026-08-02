"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsPanel } from "@/components/ui/Tabs";
import { SOCIAL_EXAMPLE_POSTS } from "@/features/social-media/data/example-posts";
import { SocialConnectionBanner } from "@/features/social-media/components/social-connection-banner";
import { SocialExamplePostCard } from "@/features/social-media/components/social-example-post-card";
import {
  SocialPostComposerModal,
  type SocialPostComposerDraft,
} from "@/features/social-media/components/social-post-composer-modal";
import { SocialPostEditor } from "@/features/social-media/components/social-post-editor";
import { SocialPostListCard } from "@/features/social-media/components/social-post-list-card";
import { getRealEstateObjectById } from "@/features/real-estate/object/object-memory";
import { subscribeRealEstateObjects } from "@/features/real-estate/object/object-memory";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import type {
  SocialConnection,
  SocialPost,
} from "@/features/social-media/types/social-media-types";

type SocialTab = "drafts" | "scheduled" | "published" | "examples";

const TAB_ITEMS = [
  { id: "drafts", label: "Entwürfe" },
  { id: "scheduled", label: "Geplant" },
  { id: "published", label: "Veröffentlicht" },
  { id: "examples", label: "Beispiele" },
] as const;

function EmptyDraftsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-6 py-10 text-center">
      <p className="text-[15px] font-semibold text-[var(--text-primary)]">
        Noch keine Posts erstellt
      </p>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-[var(--text-secondary)]">
        Stelle ein Objekt online und HELPY erstellt automatisch Posts für alle Plattformen — oder
        erstelle manuell einen Entwurf.
      </p>
      <Button type="button" onClick={onCreate} className="mt-5 rounded-[12px]">
        Manuell erstellen
      </Button>
    </div>
  );
}

function SocialMediaContent() {
  const searchParams = useSearchParams();
  const objektId = searchParams.get("objektId")?.trim() ?? "";
  const revision = useStoreRevision(subscribeRealEstateObjects);

  const object = useMemo(
    () => (objektId ? getRealEstateObjectById(objektId) : null),
    [objektId, revision]
  );

  const [activeTab, setActiveTab] = useState<SocialTab>("examples");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerInitial, setComposerInitial] = useState<Partial<SocialPostComposerDraft> | null>(
    null
  );

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12_000);

      const response = await fetch("/api/social-media/connections", {
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setPosts([]);
        setConnections([]);
        setLoadError(payload?.error ?? "Social-Media-Daten konnten nicht geladen werden.");
        return;
      }

      const payload = (await response.json()) as {
        posts?: SocialPost[];
        connections?: SocialConnection[];
      };
      setPosts(payload.posts ?? []);
      setConnections(payload.connections ?? []);
    } catch (err) {
      setPosts([]);
      setConnections([]);
      setLoadError(
        err instanceof Error && err.name === "AbortError"
          ? "Zeitüberschreitung beim Laden."
          : "Social-Media-Daten konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const drafts = useMemo(() => posts.filter((post) => post.status === "draft"), [posts]);
  const scheduled = useMemo(() => posts.filter((post) => post.status === "scheduled"), [posts]);
  const published = useMemo(() => posts.filter((post) => post.status === "published"), [posts]);

  const openComposer = (initial?: Partial<SocialPostComposerDraft> | null) => {
    setComposerInitial(initial ?? null);
    setComposerOpen(true);
  };

  const handleTryDemo = (example: (typeof SOCIAL_EXAMPLE_POSTS)[number]) => {
    openComposer({
      platform: example.platform,
      textContent: example.textContent,
      hashtags: example.hashtags,
      imageUrl: null,
      objektId: "demo",
    });
  };

  const handleEditPost = (post: SocialPost) => {
    openComposer({
      platform: post.platform,
      textContent: post.textContent ?? "",
      hashtags: post.hashtags,
      imageUrl: post.imageUrl,
      objektId: post.objektId,
    });
  };

  return (
    <DashboardShell activeHref="/social-media">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[var(--text-primary)]">📱 Social Media</h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              HELPY bereitet Posts vor — du prüfst und veröffentlichst.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => openComposer()}
            className="h-9 gap-2 rounded-[12px]"
          >
            <Plus className="size-4" />
            Post erstellen
          </Button>
        </div>

        <div className="mb-6">
          <SocialConnectionBanner connections={connections} />
        </div>

        {objektId && object ? (
          <div className="mb-8 rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                Posts für: {object.titel}
              </p>
              <Link
                href="/social-media"
                className="text-[12px] font-medium text-[var(--accent)] hover:underline"
              >
                Zur Übersicht
              </Link>
            </div>
            <SocialPostEditor object={object} />
          </div>
        ) : null}

        <Tabs
          items={[...TAB_ITEMS]}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as SocialTab)}
        />

        <TabsPanel>
          {loading ? (
            <div className="flex min-h-[160px] items-center justify-center text-[13px] text-[var(--text-secondary)]">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Posts werden geladen …
            </div>
          ) : loadError ? (
            <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
              {loadError}
            </div>
          ) : activeTab === "drafts" ? (
            drafts.length === 0 ? (
              <EmptyDraftsState onCreate={() => openComposer()} />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {drafts.map((post) => (
                  <SocialPostListCard key={post.id} post={post} onEdit={handleEditPost} />
                ))}
              </div>
            )
          ) : activeTab === "scheduled" ? (
            scheduled.length === 0 ? (
              <p className="text-[13px] text-[var(--text-secondary)]">
                Keine geplanten Posts.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {scheduled.map((post) => (
                  <SocialPostListCard key={post.id} post={post} onEdit={handleEditPost} />
                ))}
              </div>
            )
          ) : activeTab === "published" ? (
            published.length === 0 ? (
              <p className="text-[13px] text-[var(--text-secondary)]">
                Noch nichts veröffentlicht.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {published.map((post) => (
                  <SocialPostListCard key={post.id} post={post} />
                ))}
              </div>
            )
          ) : (
            <div className="grid gap-4 lg:grid-cols-1">
              {SOCIAL_EXAMPLE_POSTS.map((example) => (
                <SocialExamplePostCard
                  key={example.id}
                  example={example}
                  onTryDemo={handleTryDemo}
                />
              ))}
            </div>
          )}
        </TabsPanel>
      </div>

      <SocialPostComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        initial={composerInitial}
        onSaved={() => void loadPageData()}
      />
    </DashboardShell>
  );
}

export function SocialMediaPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell activeHref="/social-media">
          <div className="flex min-h-[200px] items-center justify-center px-6 py-8 text-[13px] text-[var(--text-secondary)]">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Laden …
          </div>
        </DashboardShell>
      }
    >
      <SocialMediaContent />
    </Suspense>
  );
}
