import { isGmailVorgaengeLoading } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { isOutlookVorgaengeLoading } from "@/features/outlook/services/outlook-vorgaenge-store";

/** Lädt mindestens eine Mail-Quelle gerade Vorgänge? */
export function isMailSyncLoading(): boolean {
  return isGmailVorgaengeLoading() || isOutlookVorgaengeLoading();
}
