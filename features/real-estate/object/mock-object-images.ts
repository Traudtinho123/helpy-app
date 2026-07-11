import { buildObjectImagePlaceholderDataUrl } from "@/features/real-estate/object/object-image-utils";
import type { ObjectImage } from "@/features/real-estate/object/object-image-types";

const now = "2026-07-08T10:00:00.000Z";
const yesterday = "2026-07-07T14:30:00.000Z";

export const MOCK_OBJECT_IMAGES: Record<string, ObjectImage[]> = {
  "obj-bahnhofstrasse-12-zuerich": [
    {
      id: "img-bahnhof-cover",
      objectId: "obj-bahnhofstrasse-12-zuerich",
      url: buildObjectImagePlaceholderDataUrl("Wohnzimmer", "#2563EB"),
      fileName: "wohnzimmer.jpg",
      source: "ImmoScout24",
      isCover: true,
      sortOrder: 0,
      createdAt: now,
      status: "bestätigt",
    },
    {
      id: "img-bahnhof-balkon",
      objectId: "obj-bahnhofstrasse-12-zuerich",
      url: buildObjectImagePlaceholderDataUrl("Balkon", "#3B82F6"),
      fileName: "balkon.jpg",
      source: "ImmoScout24",
      isCover: false,
      sortOrder: 1,
      createdAt: now,
      status: "bestätigt",
    },
    {
      id: "img-bahnhof-gmail",
      objectId: "obj-bahnhofstrasse-12-zuerich",
      url: buildObjectImagePlaceholderDataUrl("Küche — Gmail Anhang", "#64748B"),
      fileName: "kueche-interessent.jpg",
      source: "Gmail Anhang",
      isCover: false,
      sortOrder: 2,
      createdAt: yesterday,
      status: "helpy-erkannt",
    },
  ],
  "link-https-immoscout24-ch-expose-12345678": [
    {
      id: "img-seestrasse-cover",
      objectId: "link-https-immoscout24-ch-expose-12345678",
      url: buildObjectImagePlaceholderDataUrl("Seesicht", "#0EA5E9"),
      fileName: "aussicht.jpg",
      source: "ImmoScout24",
      isCover: true,
      sortOrder: 0,
      createdAt: yesterday,
      status: "bestätigt",
    },
  ],
  "obj-homegate-maisonette-bern": [
    {
      id: "img-bern-garten",
      objectId: "obj-homegate-maisonette-bern",
      url: buildObjectImagePlaceholderDataUrl("Garten", "#059669"),
      fileName: "garten.jpg",
      source: "Homegate",
      isCover: true,
      sortOrder: 0,
      createdAt: yesterday,
      status: "bestätigt",
    },
  ],
};

export function getMockObjectImages(objectId: string): ObjectImage[] {
  return MOCK_OBJECT_IMAGES[objectId] ?? [];
}
