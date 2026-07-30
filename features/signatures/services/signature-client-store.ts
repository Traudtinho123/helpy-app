"use client";

import type { DocumentSignatureRecord } from "@/features/signatures/types/signature-types";

let cachedSignatures = new Map<string, DocumentSignatureRecord>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeSignatures(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSignatureForDocument(
  documentId: string
): DocumentSignatureRecord | undefined {
  return cachedSignatures.get(documentId);
}

export async function fetchSignatureForDocument(
  documentId: string
): Promise<DocumentSignatureRecord | null> {
  const response = await fetch(
    `/api/signatures?document_id=${encodeURIComponent(documentId)}`,
    { cache: "no-store" }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    signature?: DocumentSignatureRecord | null;
  };

  if (data.signature) {
    cachedSignatures.set(documentId, data.signature);
    notify();
    return data.signature;
  }

  cachedSignatures.delete(documentId);
  notify();
  return null;
}

export async function fetchAllSignatures(): Promise<DocumentSignatureRecord[]> {
  const response = await fetch("/api/signatures", { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as {
    signatures?: DocumentSignatureRecord[];
  };

  cachedSignatures = new Map(
    (data.signatures ?? []).map((item) => [item.helpy_document_id, item])
  );
  notify();
  return [...cachedSignatures.values()];
}

export type SignatureNotification = {
  id: string;
  title: string;
  createdAt: string;
};

let signatureNotifications: SignatureNotification[] = [];
const notificationListeners = new Set<() => void>();

export function subscribeSignatureNotifications(
  listener: () => void
): () => void {
  notificationListeners.add(listener);
  return () => notificationListeners.delete(listener);
}

export function pushSignatureNotification(title: string): void {
  signatureNotifications = [
    {
      id: `sig-notif-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
    },
    ...signatureNotifications,
  ].slice(0, 20);
  notificationListeners.forEach((listener) => listener());

  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("HELPY Unterschrift", { body: title });
    }
  }
}

export function getSignatureNotifications(): SignatureNotification[] {
  return [...signatureNotifications];
}

export async function sendDocumentForSignature(input: {
  documentId: string;
  documentTitle: string;
  fileName: string;
  pdfBase64: string;
  signers: { name: string; email: string }[];
  message?: string;
  vorgangId?: string | null;
  kundeId?: string | null;
  objektId?: string | null;
}): Promise<DocumentSignatureRecord | null> {
  const response = await fetch("/api/signatures/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Senden fehlgeschlagen.");
  }

  const data = (await response.json()) as {
    signature?: DocumentSignatureRecord;
  };

  if (data.signature) {
    cachedSignatures.set(input.documentId, data.signature);
    notify();
  }

  return data.signature ?? null;
}

export async function remindSignature(documentId: string): Promise<boolean> {
  const response = await fetch(
    `/api/signatures/${encodeURIComponent(documentId)}/remind`,
    { method: "POST" }
  );
  return response.ok;
}

export async function voidSignature(documentId: string): Promise<boolean> {
  const response = await fetch(
    `/api/signatures/${encodeURIComponent(documentId)}/void`,
    { method: "POST" }
  );

  if (!response.ok) return false;

  await fetchSignatureForDocument(documentId);
  return true;
}
