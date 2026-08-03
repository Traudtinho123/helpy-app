import { readApiErrorMessage } from "@/lib/http/fetch-errors";

export type SocialImageUploadResult = {
  url: string;
  path: string;
  storage?: string;
  message?: string;
};

export async function uploadSocialMediaImage(input: {
  file: File;
  objektId?: string;
}): Promise<SocialImageUploadResult> {
  const form = new FormData();
  form.set("file", input.file);
  form.set("objekt_id", input.objektId?.trim() || "manual");

  const response = await fetch("/api/social-media/images", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, "Bild-Upload fehlgeschlagen.")
    );
  }

  const payload = (await response.json()) as SocialImageUploadResult;
  if (!payload.url) {
    throw new Error("Keine Bild-URL vom Server erhalten.");
  }

  return payload;
}

export async function readImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht gelesen werden."));
    };
    img.src = url;
  });
}

export const SOCIAL_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const SOCIAL_IMAGE_MIN_INSTAGRAM = 1080;

export function validateSocialImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Nur Bilddateien (JPG, PNG) sind erlaubt.";
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!allowed.includes(file.type) && !file.name.match(/\.(jpe?g|png)$/i)) {
    return "Nur JPG- oder PNG-Bilder sind erlaubt.";
  }

  if (file.size > SOCIAL_IMAGE_MAX_BYTES) {
    return "Datei ist zu gross (max. 10 MB).";
  }

  return null;
}
