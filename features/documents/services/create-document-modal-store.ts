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
  return { open, request };
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
