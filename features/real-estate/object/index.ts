export type {
  RealEstateObject,
  RealEstateObjectDetectionInput,
  RealEstateObjectFieldExtraction,
  RealEstateObjectInteressentLink,
  RealEstateObjectSource,
  RealEstateObjectStatus,
  RealEstateObjectTransaction,
} from "@/features/real-estate/object/object-types";

export type {
  ObjectImage,
  ObjectImageSource,
  ObjectImageStatus,
} from "@/features/real-estate/object/object-image-types";

export {
  HELPY_BUTTON_OBJEKT_OEFFNEN,
  HELPY_OBJECT_CARD_HINT,
  HELPY_OBJECT_CARD_TITLE,
  REAL_ESTATE_OBJECT_STATUS_LABELS,
} from "@/features/real-estate/object/object-types";

export {
  detectRealEstatePlatformSource,
  extractRealEstateObjectFields,
  hasRecognizedObjectData,
  isRealEstatePlatformQuelle,
  shouldPrepareRealEstateObject,
} from "@/features/real-estate/object/object-detector";

export {
  buildObjectDedupeKey,
  clearRealEstateObjectStore,
  findExistingRealEstateObject,
  getAllRealEstateObjects,
  getRealEstateObjectById,
  peekRealEstateObjectByVorgangId,
  subscribeRealEstateObjects,
  upsertRealEstateObject,
} from "@/features/real-estate/object/object-memory";

export {
  appendDocumentIdToObject,
  syncObjectDocumentIds,
} from "@/features/real-estate/object/object-link-sync";

export {
  getRealEstateObjectPath,
  getRealEstateObjectServerSnapshot,
  getRealEstateObjectSnapshot,
  getStableRealEstateObjectByIdSnapshot,
  linkBesichtigungToRealEstateObject,
  linkViewingToObject,
  prepareRealEstateObjectFromBundle,
  prepareRealEstateObjectFromListe,
  seedMockRealEstateObjects,
  seedRealEstateObjectsFromBundles,
  seedRealEstateObjectsFromListeVorgaenge,
  subscribeRealEstateObject,
} from "@/features/real-estate/object/object-service";

export {
  addManualObjectImages,
  confirmObjectImage,
  getObjectImages,
  importPlatformObjectImages,
  mapPlatformSourceToImageSource,
  suggestGmailAttachmentAsObjectImage,
} from "@/features/real-estate/object/object-image-service";

export { suggestGmailAttachmentForLinkedObject } from "@/features/real-estate/object/object-image-gmail-detection";
