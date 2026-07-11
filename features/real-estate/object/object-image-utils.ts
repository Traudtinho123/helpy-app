import {
  IMAGE_ATTACHMENT_EXTENSIONS,
  IMAGE_ATTACHMENT_MIME_TYPES,
  type ObjectImage,
} from "@/features/real-estate/object/object-image-types";

export function buildObjectImagePlaceholderDataUrl(
  title: string,
  accent = "#2563EB"
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#EFF6FF"/>
        <stop offset="100%" stop-color="${accent}33"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#g)"/>
    <text x="400" y="240" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" fill="#64748B">${title}</text>
    <text x="400" y="270" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#94A3B8">Objektbild</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function isImageAttachment(fileName: string, mimeType?: string | null): boolean {
  const lower = fileName.toLowerCase();
  const hasExtension = IMAGE_ATTACHMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));

  if (hasExtension) return true;
  if (!mimeType) return false;

  return IMAGE_ATTACHMENT_MIME_TYPES.includes(
    mimeType.toLowerCase() as (typeof IMAGE_ATTACHMENT_MIME_TYPES)[number]
  );
}

export function sortObjectImages(images: ObjectImage[]): ObjectImage[] {
  return [...images].sort((left, right) => {
    if (left.isCover !== right.isCover) {
      return left.isCover ? -1 : 1;
    }
    return left.sortOrder - right.sortOrder;
  });
}

export function getCoverObjectImage(images: ObjectImage[]): ObjectImage | null {
  if (images.length === 0) return null;
  return sortObjectImages(images)[0] ?? null;
}

export function getCoverImageUrl(images: ObjectImage[]): string | null {
  const cover = getCoverObjectImage(images.filter((image) => image.status === "bestätigt"));
  return cover?.url ?? null;
}

export function createObjectImageId(objectId: string, fileName: string): string {
  const slug = fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `img-${objectId}-${slug}-${Date.now()}`;
}
