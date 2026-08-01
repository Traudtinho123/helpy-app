import type { CreateDocumentKind } from "@/features/documents/services/document-text-generator";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export type CreateDocumentModalRequest = {
  kind: CreateDocumentKind;
  vorgang: Vorgang;
  object?: RealEstateObject | null;
};

const listeners = new Set<() => void>();

let open = false;
let request: CreateDocumentModalRequest | null = null;

export const CREATE_DOCUMENT_MODAL_CLOSED_SNAPSHOT = {
  open: false,
  request: null as CreateDocumentModalRequest | null,
};

let modalStateSnapshot: {
  open: boolean;
  request: CreateDocumentModalRequest | null;
} = CREATE_DOCUMENT_MODAL_CLOSED_SNAPSHOT;

function recomputeModalStateSnapshot(): {
  open: boolean;
  request: CreateDocumentModalRequest | null;
} {
  if (
    modalStateSnapshot.open === open &&
    modalStateSnapshot.request === request
  ) {
    return modalStateSnapshot;
  }

  if (!open && request === null) {
    modalStateSnapshot = CREATE_DOCUMENT_MODAL_CLOSED_SNAPSHOT;
    return modalStateSnapshot;
  }

  modalStateSnapshot = { open, request };
  return modalStateSnapshot;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeCreateDocumentModal(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCreateDocumentModalState(): {
  open: boolean;
  request: CreateDocumentModalRequest | null;
} {
  return recomputeModalStateSnapshot();
}

export function getCreateDocumentModalServerSnapshot(): {
  open: boolean;
  request: CreateDocumentModalRequest | null;
} {
  return CREATE_DOCUMENT_MODAL_CLOSED_SNAPSHOT;
}

export function openCreateDocumentModal(input: CreateDocumentModalRequest): void {
  open = true;
  request = input;
  notify();
}

export function closeCreateDocumentModal(): void {
  open = false;
  request = null;
  notify();
}
