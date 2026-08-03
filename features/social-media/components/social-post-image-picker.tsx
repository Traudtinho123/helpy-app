"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImageFile } from "@/features/portal-publish/services/image-compress";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import {
  readImageDimensions,
  SOCIAL_IMAGE_MIN_INSTAGRAM,
  uploadSocialMediaImage,
  validateSocialImageFile,
} from "@/features/social-media/services/social-image-upload";
import type { SocialPlatform } from "@/features/social-media/types/social-media-types";
import { cn } from "@/lib/utils";

type SocialPostImagePickerProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  object?: RealEstateObject | null;
  objektId?: string;
  platform?: SocialPlatform;
};

function PostImagePreview({
  src,
  onRemove,
}: {
  src: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-[var(--border)]">
      <div className="relative aspect-square w-full max-w-[280px] bg-[var(--bg-elevated)]">
        {src.startsWith("http") || src.startsWith("data:") ? (
          src.startsWith("http") ? (
            <Image src={src} alt="Post-Bild" fill className="object-cover" unoptimized />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Post-Bild" className="size-full object-cover" />
          )
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Post-Bild" className="size-full object-cover" />
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRemove}
        className="absolute right-2 top-2 h-8 rounded-[10px] border-[var(--border)] bg-[var(--bg-surface)]/95 px-2.5 text-[11px] shadow-sm"
      >
        <Trash2 className="mr-1 size-3.5" />
        Entfernen
      </Button>
    </div>
  );
}

export function SocialPostImagePicker({
  value,
  onChange,
  object,
  objektId,
  platform,
}: SocialPostImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sizeHint, setSizeHint] = useState<string | null>(null);
  const [showObjectPicker, setShowObjectPicker] = useState(false);

  const objectImages = object?.images ?? [];
  const resolvedObjektId = objektId ?? object?.objectId;

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setSizeHint(null);

      const validationError = validateSocialImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setUploading(true);
      try {
        const compressed = await compressImageFile(file, {
          maxWidth: 2048,
          maxHeight: 2048,
        });

        try {
          const { width, height } = await readImageDimensions(compressed);
          if (
            platform === "instagram" &&
            (width < SOCIAL_IMAGE_MIN_INSTAGRAM || height < SOCIAL_IMAGE_MIN_INSTAGRAM)
          ) {
            setSizeHint(
              `Hinweis: Für Instagram mindestens ${SOCIAL_IMAGE_MIN_INSTAGRAM}×${SOCIAL_IMAGE_MIN_INSTAGRAM}px empfohlen (aktuell ${width}×${height}).`
            );
          }
        } catch {
          // Dimensions optional
        }

        const result = await uploadSocialMediaImage({
          file: compressed,
          objektId: resolvedObjektId,
        });
        onChange(result.url);
        setShowObjectPicker(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
      } finally {
        setUploading(false);
      }
    },
    [onChange, platform, resolvedObjektId]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const file = [...files][0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  return (
    <div className="space-y-3">
      {value ? <PostImagePreview src={value} onRemove={() => onChange(null)} /> : null}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (uploading) return;
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-[14px] border border-dashed px-4 py-5 text-center transition-colors",
          dragOver
            ? "border-[var(--border-accent)] bg-[var(--accent-light)]/50"
            : "border-[var(--border)] bg-[var(--bg-elevated)]/60"
        )}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-2">
          <ImagePlus className="size-6 text-[var(--text-secondary)]" />
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">
            🖼️ Bild hochladen
          </p>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Ziehe ein Bild hierher oder
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-[10px]"
          >
            {uploading ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}
            Datei auswählen
          </Button>
          <p className="text-[11px] text-[var(--text-muted)]">
            JPG, PNG · Max. 10MB
            <br />
            Min. 1080×1080px für Instagram
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) {
              handleFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
      </div>

      {objectImages.length > 0 ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowObjectPicker((current) => !current)}
            className="text-[12px] font-semibold text-[var(--accent)] hover:underline"
          >
            📸 Aus Objekt wählen
          </button>
          {showObjectPicker ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {objectImages.map((image) => {
                const selected = value === image.url;
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => {
                      onChange(image.url);
                      setShowObjectPicker(false);
                      setError(null);
                    }}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-[10px] border-2 transition-all",
                      selected
                        ? "border-[var(--border-accent)] ring-2 ring-[var(--accent-light)]"
                        : "border-[var(--border)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    {image.url.startsWith("http") ? (
                      <Image
                        src={image.url}
                        alt={image.fileName || "Objektbild"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.url}
                        alt={image.fileName || "Objektbild"}
                        className="size-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          onChange(null);
          setShowObjectPicker(false);
          setError(null);
          setSizeHint(null);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
          !value
            ? "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--accent)]"
            : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
        )}
      >
        {!value ? null : <X className="size-3" />}
        Kein Bild
      </button>

      {sizeHint ? (
        <p className="text-[11px] text-[#B45309]">{sizeHint}</p>
      ) : null}
      {error ? (
        <p className="text-[11px] text-[#B91C1C]">{error}</p>
      ) : null}
    </div>
  );
}
