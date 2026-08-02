"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  ImagePlus,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImageFile } from "@/features/portal-publish/services/image-compress";
import { uploadObjektBild } from "@/features/portal-publish/services/portal-client-store";
import {
  addManualObjectImages,
  confirmObjectImage,
  OBJECT_IMAGE_SOURCE_LABELS,
  OBJECT_IMAGE_STATUS_LABELS,
  removeObjectImage,
  reorderObjectImages,
  setObjectImageAsCover,
  sortObjectImages,
} from "@/features/real-estate/object/object-image-service";
import type { ObjectImage } from "@/features/real-estate/object/object-image-types";
import { subscribeRealEstateObjects } from "@/features/real-estate/object/object-memory";
import { resolvePortfolioObjectImages } from "@/features/portfolio/services/portfolio-service";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { ObjectImageCover } from "@/features/portfolio/components/object-image-cover";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { cn } from "@/lib/utils";

type PendingUpload = {
  id: string;
  file: File;
  previewUrl: string;
};

type ObjectImagesSectionProps = {
  object: RealEstateObject;
  className?: string;
};

export function ObjectImagesSection({ object, className }: ObjectImagesSectionProps) {
  const revision = useStoreRevision(subscribeRealEstateObjects);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const images = useMemo(
    () => resolvePortfolioObjectImages(object),
    [object, revision]
  );

  const confirmedImages = useMemo(
    () => images.filter((image) => image.status === "bestätigt"),
    [images]
  );

  const suggestedImages = useMemo(
    () => images.filter((image) => image.status === "helpy-erkannt"),
    [images]
  );

  const coverImage = useMemo(
    () => sortObjectImages(confirmedImages)[0] ?? null,
    [confirmedImages]
  );

  const addFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setFeedback("Bitte nur Bilddateien hochladen.");
      return;
    }

    const compressed = await Promise.all(
      imageFiles.map((file) => compressImageFile(file))
    );

    setPendingUploads((current) => [
      ...current,
      ...compressed.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    setUploadOpen(true);
  }, []);

  const handleSelectFiles = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = [...(event.target.files ?? [])];
      void addFiles(files);
      event.target.value = "";
    },
    [addFiles]
  );

  const handleSaveUploads = useCallback(async () => {
    if (pendingUploads.length === 0) return;
    setSaving(true);
    setFeedback(null);

    const urls: string[] = [];
    let usedStorage: string | undefined;

    for (const item of pendingUploads) {
      const uploaded = await uploadObjektBild({
        objektId: object.objectId,
        file: item.file,
      });
      if (uploaded.url) {
        urls.push(uploaded.url);
        usedStorage = uploaded.storage;
      } else {
        urls.push(item.previewUrl);
      }
    }

    addManualObjectImages(
      object.objectId,
      pendingUploads.map((item) => item.file),
      urls
    );

    for (const item of pendingUploads) {
      if (!urls.includes(item.previewUrl)) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }

    setPendingUploads([]);
    setUploadOpen(false);
    setSaving(false);
    setFeedback(
      usedStorage === "supabase"
        ? "Bilder gespeichert (Supabase Storage)."
        : "Bilder gespeichert (lokal / Fallback)."
    );
  }, [object.objectId, pendingUploads]);

  const handleConfirmSuggestion = useCallback(
    (imageId: string) => {
      confirmObjectImage(object.objectId, imageId);
      setFeedback("Objektbild wurde bestätigt.");
    },
    [object.objectId]
  );

  const moveImage = useCallback(
    (imageId: string, direction: -1 | 1) => {
      const ids = confirmedImages.map((image) => image.id);
      const index = ids.indexOf(imageId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return;
      const next = [...ids];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      reorderObjectImages(object.objectId, next);
    },
    [confirmedImages, object.objectId]
  );

  return (
    <section
      className={cn(
        "rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-[12px] bg-[var(--accent-light)] text-[var(--accent)]">
          <ImagePlus className="size-4" strokeWidth={2} />
        </span>
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          📸 Bilder
        </h2>
      </div>

      <div className="space-y-4 p-5">
        <ObjectImageCover
          coverImageUrl={coverImage?.url}
          alt={coverImage?.fileName ?? object.titel}
          variant="hero"
          className="rounded-[16px]"
        />

        {confirmedImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {confirmedImages.map((image, index) => (
              <ObjectImageTile
                key={image.id}
                image={image}
                isCover={image.id === coverImage?.id}
                onSetCover={() => {
                  setObjectImageAsCover(object.objectId, image.id);
                  setFeedback("Titelbild gesetzt.");
                }}
                onMoveUp={() => moveImage(image.id, -1)}
                onMoveDown={() => moveImage(image.id, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < confirmedImages.length - 1}
                onRemove={() => {
                  removeObjectImage(object.objectId, image.id);
                  setFeedback("Bild entfernt.");
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[var(--text-secondary)]">
            Noch keine bestätigten Bilder. Füge Fotos hinzu oder bestätige HELPY-Vorschläge.
          </p>
        )}

        {suggestedImages.length > 0 && (
          <div className="rounded-[14px] border border-[var(--border-accent)] bg-[var(--accent-light)] px-3.5 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-[var(--accent)]" strokeWidth={2} />
              <p className="text-[11px] font-semibold text-[var(--accent)]">
                Von HELPY erkannt
              </p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {suggestedImages.map((image) => (
                <li
                  key={image.id}
                  className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-2.5"
                >
                  <SuggestedImagePreview image={image} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[var(--text-primary)]">
                      {image.fileName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                      {OBJECT_IMAGE_SOURCE_LABELS[image.source]} ·{" "}
                      {OBJECT_IMAGE_STATUS_LABELS[image.status]}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleConfirmSuggestion(image.id)}
                    className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
                  >
                    <BadgeCheck className="mr-1.5 size-3.5" />
                    Zuordnung bestätigen
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void addFiles([...event.dataTransfer.files]);
          }}
          className={cn(
            "rounded-[14px] border border-dashed px-4 py-6 text-center transition-colors",
            dragOver
              ? "border-[#2563EB] bg-[var(--accent-light)]"
              : "border-[var(--border)]/70 bg-[var(--bg-elevated)]"
          )}
        >
          <p className="text-[12px] font-medium text-[var(--text-secondary)]">
            Bilder hierher ziehen oder auswählen
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            JPEG, PNG, WebP — werden vor dem Speichern komprimiert
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 h-9 rounded-[12px] border-[var(--border)] bg-[var(--bg-surface)] text-[12px] font-semibold text-[var(--accent)] hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)]"
          >
            <Upload className="mr-2 size-3.5" />
            Bilder hinzufügen
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic"
            multiple
            className="hidden"
            onChange={handleSelectFiles}
          />
        </div>

        {uploadOpen && pendingUploads.length > 0 && (
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3">
            <p className="text-[11px] font-semibold tracking-[0.04em] text-[var(--text-secondary)] uppercase">
              Vorschau
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pendingUploads.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <p className="truncate px-2 py-1.5 text-[10px] text-[var(--text-secondary)]">
                    {item.file.name}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void handleSaveUploads()}
                disabled={saving}
                className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {saving ? "Speichern…" : "Speichern"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  for (const item of pendingUploads) {
                    URL.revokeObjectURL(item.previewUrl);
                  }
                  setPendingUploads([]);
                  setUploadOpen(false);
                }}
                className="h-8 rounded-[10px] text-[11px] text-[var(--text-secondary)]"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {feedback && (
          <p className="text-[11px] text-[#047857]">{feedback}</p>
        )}
      </div>
    </section>
  );
}

function ObjectImageTile({
  image,
  isCover,
  onSetCover,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onRemove,
}: {
  image: ObjectImage;
  isCover: boolean;
  onSetCover: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.fileName}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="space-y-1.5 px-2.5 py-2">
        <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
          {image.fileName}
        </p>
        <p className="text-[10px] text-[var(--text-secondary)]">
          {OBJECT_IMAGE_SOURCE_LABELS[image.source]}
          {isCover ? " · Titelbild" : ""}
        </p>
        <div className="flex flex-wrap gap-1">
          {!isCover ? (
            <button
              type="button"
              onClick={onSetCover}
              className="inline-flex h-7 items-center gap-1 rounded-[8px] border border-[var(--border)] px-2 text-[10px] font-semibold text-[var(--accent)]"
            >
              <Star className="size-3" />
              Cover
            </button>
          ) : null}
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="inline-flex size-7 items-center justify-center rounded-[8px] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40"
            aria-label="Nach vorne"
          >
            <ArrowUp className="size-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="inline-flex size-7 items-center justify-center rounded-[8px] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40"
            aria-label="Nach hinten"
          >
            <ArrowDown className="size-3" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex size-7 items-center justify-center rounded-[8px] border border-[#FEE2E2] text-[#DC2626]"
            aria-label="Entfernen"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SuggestedImagePreview({ image }: { image: ObjectImage }) {
  return (
    <div className="size-14 shrink-0 overflow-hidden rounded-[10px] border border-[var(--border-accent)] bg-[var(--accent-light)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.fileName}
        className="size-full object-cover"
      />
    </div>
  );
}
