"use client";

import {
  readPersistentJson,
  writePersistentJson,
} from "@/lib/store/persistent-client-storage";

const STORAGE_PREFIX = "helpy-finanzen-monatsziel";

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}:${companyId}`;
}

export function getMonatsziel(companyId: string): number {
  const value = readPersistentJson<{ monatsziel: number }>({
    storageKey: storageKey(companyId),
  });
  return value?.monatsziel ?? 0;
}

export function setMonatsziel(companyId: string, monatsziel: number): void {
  writePersistentJson(
    { storageKey: storageKey(companyId) },
    { monatsziel: Math.max(0, monatsziel) }
  );
}

export async function saveMonatszielApi(monatsziel: number): Promise<boolean> {
  const response = await fetch("/api/finanzen/monatsziel", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monatsziel }),
  });
  return response.ok;
}
