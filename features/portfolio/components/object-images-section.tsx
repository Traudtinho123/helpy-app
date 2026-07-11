"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { BadgeCheck, ImagePlus, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addManualObjectImages,
  confirmObjectImage,
  OBJECT_IMAGE_SOURCE_LABELS,
  OBJECT_IMAGE_STATUS_LABELS,
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

  const handleSelectFiles = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = [...(event.target.files ?? [])];
      if (files.length === 0) return;

      setPendingUploads((current) => [
        ...current,
        ...files.map((file) => ({
          id: `${file.name}-${file.lastModified}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
      setUploadOpen(true);
      event.target.value = "";
    },
    []
  );

  const handleSaveUploads = useCallback(() => {
    if (pendingUploads.length === 0) return;

    addManualObjectImages(
      object.objectId,
      pendingUploads.map((item) => item.file)
    );

    for (const item of pendingUploads) {
      URL.revokeObjectURL(item.previewUrl);
    }

    setPendingUploads([]);
    setUploadOpen(false);
    setFeedback("Bilder wurden lokal gespeichert (Mock). Später: Supabase Storage.");
  }, [object.objectId, pendingUploads]);

  const handleConfirmSuggestion = useCallback(
    (imageId: string) => {
      confirmObjectImage(object.objectId, imageId);
      setFeedback("Objektbild wurde bestätigt.");
    },
    [object.objectId]
  );

  return (
    <section
      className={cn(
        "rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-[#CBD5E1]/30 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]">
          <ImagePlus className="size-4" strokeWidth={2} />
        </span>
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
          Bilder
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
            {confirmedImages.map((image) => (
              <ObjectImageTile key={image.id} image={image} isCover={image.id === coverImage?.id} />
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[#64748B]">
            Noch keine bestätigten Bilder. Füge Fotos hinzu oder bestätige HELPY-Vorschläge.
          </p>
        )}

        {suggestedImages.length > 0 && (
          <div className="rounded-[14px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/45 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-[#2563EB]" strokeWidth={2} />
              <p className="text-[11px] font-semibold text-[#2563EB]">
                Von HELPY erkannt
              </p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {suggestedImages.map((image) => (
                <li
                  key={image.id}
                  className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#E2E8F0]/70 bg-white/80 p-2.5"
                >
                  <SuggestedImagePreview image={image} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[#0F172A]">
                      {image.fileName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setUploadOpen(true);
              fileInputRef.current?.click();
            }}
            className="h-9 rounded-[12px] border-[#CBD5E1]/60 bg-white text-[12px] font-semibold text-[#2563EB] hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]"
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
          <div className="rounded-[14px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-3.5 py-3">
            <p className="text-[11px] font-semibold tracking-[0.04em] text-[#64748B] uppercase">
              Vorschau
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pendingUploads.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[12px] border border-[#E2E8F0]/70 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <p className="truncate px-2 py-1.5 text-[10px] text-[#64748B]">
                    {item.file.name}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleSaveUploads}
                className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
              >
                Speichern (Mock)
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
                className="h-8 rounded-[10px] text-[11px] text-[#64748B]"
              >
                Abbrechen
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-[#94A3B8]">
              Upload wird lokal gespeichert. Später erfolgt die Ablage in Supabase Storage.
            </p>
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
}: {
  image: ObjectImage;
  isCover: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E2E8F0]/70 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.fileName}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="space-y-1 px-2.5 py-2">
        <p className="truncate text-[11px] font-medium text-[#0F172A]">
          {image.fileName}
        </p>
        <p className="text-[10px] text-[#64748B]">
          {OBJECT_IMAGE_SOURCE_LABELS[image.source]}
          {isCover ? " · Titelbild" : ""}
        </p>
      </div>
    </div>
  );
}

function SuggestedImagePreview({ image }: { image: ObjectImage }) {
  return (
    <div className="size-14 shrink-0 overflow-hidden rounded-[10px] border border-[#BFDBFE]/60 bg-[#EFF6FF]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.fileName}
        className="size-full object-cover"
      />
    </div>
  );
}
