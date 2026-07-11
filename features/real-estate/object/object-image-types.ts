export type ObjectImageSource =
  | "manuell hochgeladen"
  | "Gmail Anhang"
  | "ImmoScout24"
  | "Homegate"
  | "Newhome";

export type ObjectImageStatus = "bestätigt" | "helpy-erkannt";

export type ObjectImage = {
  id: string;
  objectId: string;
  url: string;
  fileName: string;
  source: ObjectImageSource;
  isCover: boolean;
  sortOrder: number;
  createdAt: string;
  status: ObjectImageStatus;
};

export const OBJECT_IMAGE_SOURCE_LABELS: Record<ObjectImageSource, string> = {
  "manuell hochgeladen": "Manuell hochgeladen",
  "Gmail Anhang": "Gmail Anhang",
  ImmoScout24: "ImmoScout24",
  Homegate: "Homegate",
  Newhome: "Newhome",
};

export const OBJECT_IMAGE_STATUS_LABELS: Record<ObjectImageStatus, string> = {
  bestätigt: "Bestätigt",
  "helpy-erkannt": "Von HELPY erkannt",
};

export const IMAGE_ATTACHMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
] as const;

export const IMAGE_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;
