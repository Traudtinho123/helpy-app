export {
  confirmKundenakte,
  createReviewForKundenakte,
  getKundenakteConfirmMessage,
  HELPY_BUTTON_KUNDENAKTE_BESTAETIGEN,
  HELPY_BUTTON_KUNDENAKTE_PRUEFEN,
  HELPY_KNOWN_CUSTOMER_LABEL,
  HELPY_KUNDENAKTE_CARD_TITLE,
  HELPY_KUNDENAKTE_HINT,
  prepareKundenakteFromBundle,
  prepareKundenakteFromWorkspace,
  seedKundenaktenFromBundles,
  seedKundenaktenFromListeVorgaenge,
  updateKundenakteFields,
} from "@/features/kundenakte/services/kundenakte-engine";

export {
  getAllKundenakten,
  getConfirmedKundenakten,
  getConfirmedKundenaktenServerSnapshot,
  getConfirmedKundenaktenSnapshot,
  getKundenakteServerSnapshot,
  getKundenakteSnapshot,
  peekKundenakteByVorgangId,
  subscribeKundenakte,
} from "@/features/kundenakte/services/kundenakte-store";

export { mergeCustomersWithConfirmedKundenakten, kundenakteToCustomer } from "@/features/kundenakte/services/kundenakte-mapper";

export type { Kundenakte, KundenakteStatus, KundenakteTimelineEntry } from "@/features/kundenakte/types/kundenakte-types";

export { KUNDENAKTE_STATUS_LABELS } from "@/features/kundenakte/types/kundenakte-types";

export { KundenakteWorkspaceCard } from "@/features/kundenakte/components/kundenakte-workspace-card";

export { useConfirmedKundenakten, useKundenakte } from "@/features/kundenakte/hooks/use-kundenakte";
