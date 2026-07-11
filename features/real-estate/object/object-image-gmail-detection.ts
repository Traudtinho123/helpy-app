import {
  isImageAttachment,
  suggestGmailAttachmentAsObjectImage,
} from "@/features/real-estate/object/object-image-service";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import type { ObjectImage } from "@/features/real-estate/object/object-image-types";

export type GmailObjectImageSuggestionInput = {
  vorgangId: string;
  fileName: string;
  url: string;
  mimeType?: string | null;
};

/**
 * Prüft Gmail-Anhänge und schlägt Bilder als Objektfotos vor,
 * wenn der Vorgang einem Objekt zugeordnet ist.
 */
export function suggestGmailAttachmentForLinkedObject(
  input: GmailObjectImageSuggestionInput
): ObjectImage | null {
  if (!isImageAttachment(input.fileName, input.mimeType)) {
    return null;
  }

  const object = peekRealEstateObjectByVorgangId(input.vorgangId);
  if (!object) return null;

  return suggestGmailAttachmentAsObjectImage({
    objectId: object.objectId,
    vorgangId: input.vorgangId,
    fileName: input.fileName,
    url: input.url,
    mimeType: input.mimeType,
  });
}
