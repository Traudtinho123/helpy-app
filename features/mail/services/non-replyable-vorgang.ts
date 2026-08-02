import { isPlaceholderSenderLabel } from "@/features/gmail/services/parse-from-header";
import {
  isKnownSystemDomain,
  isNoreplyAddress,
} from "@/features/mail/services/system-mail-detector";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";

/** Vorgänge ohne Antwort-Möglichkeit (Newsletter, System-Mails). */
export function isNonReplyableVorgang(vorgang: ListeVorgang): boolean {
  if (shouldPrepareArchive(vorgang)) return true;
  if (vorgang.intent === "spam_newsletter") return true;
  if (vorgang.intentLabel === "Spam / Newsletter") return true;

  const from = vorgang.from ?? vorgang.latestMessageFrom ?? "";
  const email =
    vorgang.absenderEmail ??
    extractEmailAddress(from) ??
    null;

  if (isPlaceholderSenderLabel(vorgang.kunde) && !email) return true;
  if (email && (isNoreplyAddress(email) || isKnownSystemDomain(email))) return true;

  const summary = `${vorgang.summary ?? ""} ${vorgang.helpyEmpfehlung ?? ""}`.toLowerCase();
  if (
    summary.includes("werbe- oder newsletter") ||
    summary.includes("newsletter-nachricht")
  ) {
    return true;
  }

  return false;
}
