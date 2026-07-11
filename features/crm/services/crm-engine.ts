import {
  findCrmCustomerByMatch,
  getAllCrmCustomers,
  subscribeCrm,
} from "@/features/crm/services/crm-store";
import {
  bootstrapCrmFromGmailCache,
  syncCrmFromGmailBundle,
  syncCrmFromGmailBundles,
  syncCrmFromWorkspaceVorgang,
} from "@/features/crm/services/crm-sync";
import type {
  CrmWorkspaceView,
  HelpyCrmCustomer,
} from "@/features/crm/types/crm-types";
import type {
  CustomerMemoryContact,
  CustomerMemoryHistoryItem,
  CustomerMemoryProfile,
} from "@/features/memory/types/customer-memory-types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

function extractEmailFromVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): string {
  const from = liste?.from ?? vorgang.letzteEmail.absender;
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();
  if (from.includes("@")) return from.trim();
  return vorgang.kunde.email !== "—" ? vorgang.kunde.email : "";
}

export function lookupCrmCustomerForVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): HelpyCrmCustomer | null {
  const email = extractEmailFromVorgang(vorgang, liste);

  return findCrmCustomerByMatch({
    email,
    telefon: vorgang.kunde.telefon,
    firma: vorgang.kunde.firmenname,
    ansprechpartner: vorgang.kunde.ansprechpartner,
  });
}

/** @deprecated Alias — liest nur, synchronisiert nicht. */
export function resolveCrmCustomerForVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): HelpyCrmCustomer | null {
  return lookupCrmCustomerForVorgang(vorgang, liste);
}

export function getCrmWorkspaceView(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): CrmWorkspaceView {
  const customer = lookupCrmCustomerForVorgang(vorgang, liste);

  return {
    customer,
    isNewCustomer: customer?.status === "neu",
  };
}

export function applyCrmToVorgangKunde(
  vorgang: WorkspaceVorgang,
  customer: HelpyCrmCustomer | null
): WorkspaceVorgang["kunde"] {
  if (!customer) return vorgang.kunde;

  return {
    ...vorgang.kunde,
    firmenname: customer.firma || vorgang.kunde.firmenname,
    ansprechpartner: customer.ansprechpartner || vorgang.kunde.ansprechpartner,
    email: customer.email || vorgang.kunde.email,
    telefon: customer.telefon || vorgang.kunde.telefon,
    adresse: customer.adresse || vorgang.kunde.adresse,
    branche: customer.branche || vorgang.kunde.branche,
    status: customer.status === "neu" ? "Neuer Kunde" : "Bestandskunde",
  };
}

export function crmCustomerToMemoryProfile(
  customer: HelpyCrmCustomer
): CustomerMemoryProfile {
  const history: CustomerMemoryHistoryItem[] = customer.timeline.map((entry) => ({
    id: entry.id,
    type:
      entry.type === "dokument" || entry.type === "projekt"
        ? "vorgang"
        : entry.type,
    title: entry.title,
    date: entry.date,
    dateLabel: entry.dateLabel,
    summary: entry.summary,
    vorgangId: entry.vorgangId,
    status: entry.status,
  }));

  const contact: CustomerMemoryContact = {
    id: customer.id,
    name: customer.ansprechpartner,
    company: customer.firma,
    email: customer.email,
    phone: customer.telefon,
    address: customer.adresse,
    skill: customer.skill,
    communicationStyle: "E-Mail und schriftliche Bestätigung",
    tone: "Professionell und freundlich",
    specialRequests: [],
    notes: customer.notes,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    lastContactAt: customer.lastContactAt,
  };

  return {
    contact,
    history,
    vorgangIds: customer.vorgangIds,
  };
}

export {
  bootstrapCrmFromGmailCache,
  subscribeCrm,
  syncCrmFromGmailBundle,
  syncCrmFromGmailBundles,
  syncCrmFromWorkspaceVorgang,
};

export function getAllCrmCustomersForList(): HelpyCrmCustomer[] {
  return getAllCrmCustomers();
}
