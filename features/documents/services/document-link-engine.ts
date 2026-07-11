import { getAppointmentSuggestion } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { getCrmPipelineRecord } from "@/features/crm/pipeline/pipeline-store";
import type {
  PreparedDocument,
  PreparedDocumentLinks,
} from "@/features/documents/services/types";
import { buildCustomerIdFromEmail } from "@/features/intelligence/customer-memory/customer-memory-store";
import { peekKundenakteByVorgangId } from "@/features/kundenakte/services/kundenakte-store";
import {
  getRealEstateObjectById,
  peekRealEstateObjectByVorgangId,
} from "@/features/real-estate/object/object-memory";

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function resolveObjectForDocument(document: PreparedDocument) {
  if (document.objectId) {
    return getRealEstateObjectById(document.objectId);
  }
  if (document.vorgangId) {
    return peekRealEstateObjectByVorgangId(document.vorgangId);
  }
  if (document.links?.objectId) {
    return getRealEstateObjectById(document.links.objectId);
  }
  return null;
}

function resolveCustomerFromVorgang(vorgangId?: string) {
  if (!vorgangId) return null;
  const kundenakte = peekKundenakteByVorgangId(vorgangId);
  if (!kundenakte?.email || kundenakte.email === "—") {
    return kundenakte
      ? { name: kundenakte.name, email: null as string | null, customerId: null as string | null }
      : null;
  }

  return {
    name: kundenakte.name,
    email: kundenakte.email,
    customerId: buildCustomerIdFromEmail(kundenakte.email),
  };
}

function buildExposeLinks(
  document: PreparedDocument,
  object: ReturnType<typeof resolveObjectForDocument>,
  customer: ReturnType<typeof resolveCustomerFromVorgang>,
  pipelineStage?: PreparedDocumentLinks["pipelineStage"]
): PreparedDocumentLinks {
  const vorgangId = document.vorgangId;
  const appointment = vorgangId ? getAppointmentSuggestion(vorgangId) : null;
  const interessentLinks = object?.interessentLinks ?? [];

  return {
    objectId: object?.objectId ?? document.objectId,
    objectTitle: object?.titel,
    customerId: customer?.customerId ?? undefined,
    customerEmail: customer?.email ?? undefined,
    customerName: customer?.name ?? document.customer,
    pipelineStage,
    interessentVorgangIds: uniqueStrings([
      ...interessentLinks.map((link) => link.vorgangId),
      vorgangId,
    ]),
    interessentNames: uniqueStrings([
      ...interessentLinks.map((link) => link.name),
      customer?.name,
    ]),
    besichtigungIds: uniqueStrings([
      ...(object?.besichtigungIds ?? []),
      appointment?.id,
      appointment && vorgangId ? `appointment-suggestion-${vorgangId}` : undefined,
    ]),
  };
}

function buildCustomerObjectLinks(
  document: PreparedDocument,
  object: ReturnType<typeof resolveObjectForDocument>,
  customer: ReturnType<typeof resolveCustomerFromVorgang>,
  pipelineStage?: PreparedDocumentLinks["pipelineStage"]
): PreparedDocumentLinks {
  return {
    objectId: object?.objectId ?? document.objectId,
    objectTitle: object?.titel,
    customerId: customer?.customerId ?? undefined,
    customerEmail: customer?.email ?? undefined,
    customerName: customer?.name ?? document.customer,
    pipelineStage,
  };
}

/** Stellt Verknüpfungen zu Objekt, Kunde und interner Stufenlogik her. */
export function buildDocumentLinks(document: PreparedDocument): PreparedDocumentLinks {
  const object = resolveObjectForDocument(document);
  const vorgangId = document.vorgangId ?? object?.vorgangIds[0];
  const customer = resolveCustomerFromVorgang(vorgangId);
  const pipeline = vorgangId ? getCrmPipelineRecord(vorgangId) : null;
  const pipelineStage = pipeline?.currentStage;

  if (document.typeId === "expose") {
    return buildExposeLinks(document, object, customer, pipelineStage);
  }

  if (
    document.typeId === "offerte" ||
    document.typeId === "reservationsbestaetigung"
  ) {
    return buildCustomerObjectLinks(document, object, customer, pipelineStage);
  }

  return buildCustomerObjectLinks(document, object, customer, pipelineStage);
}

export function applyDocumentLinks(document: PreparedDocument): PreparedDocument {
  const links = buildDocumentLinks(document);

  return {
    ...document,
    objectId: links.objectId ?? document.objectId,
    links,
  };
}

export function matchesDocumentToObject(
  document: PreparedDocument,
  objectId: string
): boolean {
  return document.objectId === objectId || document.links?.objectId === objectId;
}

export function matchesDocumentToCustomer(
  document: PreparedDocument,
  input: {
    vorgangId?: string;
    email?: string;
    customerId?: string;
  }
): boolean {
  const normalizedEmail = input.email?.trim().toLowerCase();
  const customerId =
    input.customerId ??
    (normalizedEmail ? buildCustomerIdFromEmail(normalizedEmail) : undefined);

  if (input.vorgangId && document.vorgangId === input.vorgangId) return true;
  if (
    input.vorgangId &&
    document.links?.interessentVorgangIds?.includes(input.vorgangId)
  ) {
    return true;
  }
  if (customerId && document.links?.customerId === customerId) return true;
  if (
    normalizedEmail &&
    document.links?.customerEmail?.trim().toLowerCase() === normalizedEmail
  ) {
    return true;
  }
  return false;
}
