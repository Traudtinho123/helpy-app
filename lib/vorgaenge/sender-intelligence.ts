import { normalizeEmail } from "@/features/crm/services/crm-merge";
import { lookupObjectsForMailQueries } from "@/features/reply-drafts/services/reply-object-lookup";
import {
  extractNamedObjectsFromMail,
  pickPrimaryObjectHint,
} from "@/features/vorgaenge/services/mail-object-extraction";
import {
  findKundeByEmail,
  findKundeIdFromDealsByEmail,
  findKundeIdFromVorgaengeByEmail,
} from "@/lib/kunden/kunden-repository";

export type VorgangSenderCase =
  | "known_customer_known_object"
  | "known_customer_no_object"
  | "unknown_sender_known_object"
  | "unknown_sender_no_object"
  | "spam_or_newsletter";

export type VorgangSenderIntelligence = {
  case: VorgangSenderCase;
  fromEmail: string | null;
  fromName: string;
  kundeId: string | null;
  kundeName: string | null;
  objektId: string | null;
  objektTitel: string | null;
  objektAdresse: string | null;
  /** Aus Mail erkannt, aber noch kein DB-Objekt gefunden. */
  erkanntesObjekt: string | null;
  objectCandidates: Array<{
    objectId: string;
    titel: string;
    adresse: string;
    score: number;
  }>;
  dealId: string | null;
  isSpam: boolean;
};

export async function resolveSenderIntelligence(input: {
  companyId: string;
  fromEmail: string | null;
  fromName: string;
  subject: string;
  body: string;
  isSpam?: boolean;
}): Promise<VorgangSenderIntelligence> {
  const email = input.fromEmail ? normalizeEmail(input.fromEmail) : null;
  const fromName = input.fromName.trim() || email || "Unbekannt";

  if (input.isSpam) {
    return {
      case: "spam_or_newsletter",
      fromEmail: email,
      fromName,
      kundeId: null,
      kundeName: null,
      objektId: null,
      objektTitel: null,
      objektAdresse: null,
      erkanntesObjekt: null,
      objectCandidates: [],
      dealId: null,
      isSpam: true,
    };
  }

  let kundeId: string | null = null;
  let kundeName: string | null = null;

  if (email) {
    const kunde = await findKundeByEmail(input.companyId, email);
    if (kunde) {
      kundeId = kunde.id;
      kundeName = kunde.ansprechpartner ?? kunde.firmenname;
    } else {
      kundeId =
        (await findKundeIdFromVorgaengeByEmail(input.companyId, email)) ??
        (await findKundeIdFromDealsByEmail(input.companyId, email));
    }
  }

  const objectQueries = extractNamedObjectsFromMail(input.subject, input.body);
  const objectLookups = lookupObjectsForMailQueries(objectQueries);
  const objectCandidates = objectLookups.map((item, index) => ({
    objectId: item.objectId,
    titel: item.titel,
    adresse: item.adresse,
    score: objectLookups.length - index,
  }));

  const topObject = objectCandidates[0] ?? null;
  const erkanntesObjekt = topObject
    ? null
    : pickPrimaryObjectHint(objectQueries);

  const knownCustomer = Boolean(kundeId || kundeName);
  const knownObject = Boolean(topObject);

  let caseType: VorgangSenderCase;
  if (knownCustomer && knownObject) {
    caseType = "known_customer_known_object";
  } else if (knownCustomer) {
    caseType = "known_customer_no_object";
  } else if (knownObject) {
    caseType = "unknown_sender_known_object";
  } else {
    caseType = "unknown_sender_no_object";
  }

  return {
    case: caseType,
    fromEmail: email,
    fromName,
    kundeId,
    kundeName,
    objektId: topObject?.objectId ?? null,
    objektTitel: topObject?.titel ?? null,
    objektAdresse: topObject?.adresse ?? null,
    erkanntesObjekt,
    objectCandidates,
    dealId: null,
    isSpam: false,
  };
}
