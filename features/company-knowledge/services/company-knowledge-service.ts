import { MOCK_COMPANY_KNOWLEDGE } from "@/features/company-knowledge/mock/company-knowledge-mock";
import {
  cloneCompanyKnowledge,
  createEmptyCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-defaults";
import type { CompanyKnowledge } from "@/features/company-knowledge/types/company-knowledge-types";

/** Nur für einmalige Migration — danach wird der Key gelöscht. */
const LEGACY_STORAGE_PREFIX = "helpy-company-knowledge-v1:";

const memoryByCompany = new Map<string, CompanyKnowledge>();
const listeners = new Set<() => void>();
const loadErrors = new Map<string, string>();
const loadingCompanies = new Set<string>();
const hydratedCompanies = new Set<string>();
const hydrationPromises = new Map<
  string,
  Promise<CompanyKnowledgeLoadResult>
>();

export type CompanyKnowledgeLoadResult =
  | {
      ok: true;
      knowledge: CompanyKnowledge;
      source: "supabase" | "migrated" | "empty" | "memory";
    }
  | { ok: false; error: string };

export type CompanyKnowledgeSaveResult =
  | { ok: true; knowledge: CompanyKnowledge }
  | { ok: false; error: string };

function notify(): void {
  listeners.forEach((listener) => listener());
}

function useInMemoryPersistence(): boolean {
  return process.env.VITEST === "true";
}

function legacyStorageKey(companyId: string): string {
  return `${LEGACY_STORAGE_PREFIX}${companyId}`;
}

function readLegacyLocalStorage(companyId: string): CompanyKnowledge | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(legacyStorageKey(companyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompanyKnowledge;
    return cloneCompanyKnowledge({ ...parsed, companyId });
  } catch {
    return null;
  }
}

function clearLegacyLocalStorage(companyId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(legacyStorageKey(companyId));
}

function seedForCompany(companyId: string): CompanyKnowledge {
  if (companyId === MOCK_COMPANY_KNOWLEDGE.companyId) {
    return cloneCompanyKnowledge(MOCK_COMPANY_KNOWLEDGE);
  }
  return createEmptyCompanyKnowledge(companyId);
}

function setCachedKnowledge(knowledge: CompanyKnowledge): CompanyKnowledge {
  const next = cloneCompanyKnowledge(knowledge);
  memoryByCompany.set(next.companyId, cloneCompanyKnowledge(next));
  loadErrors.delete(next.companyId);
  return next;
}

async function fetchKnowledgeFromApi(): Promise<
  | { ok: true; knowledge: CompanyKnowledge | null }
  | { ok: false; error: string }
> {
  try {
    const response = await fetch("/api/company-knowledge", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      knowledge?: CompanyKnowledge | null;
      error?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        error: payload.error ?? "Firmenwissen konnte nicht geladen werden.",
      };
    }

    return { ok: true, knowledge: payload.knowledge ?? null };
  } catch {
    return {
      ok: false,
      error: "Verbindung zum Server fehlgeschlagen. Bitte später erneut versuchen.",
    };
  }
}

async function saveKnowledgeToApi(
  knowledge: CompanyKnowledge
): Promise<
  | { ok: true; knowledge: CompanyKnowledge }
  | { ok: false; error: string }
> {
  try {
    const response = await fetch("/api/company-knowledge", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ knowledge }),
    });

    const payload = (await response.json()) as {
      knowledge?: CompanyKnowledge;
      error?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        error: payload.error ?? "Firmenwissen konnte nicht gespeichert werden.",
      };
    }

    if (!payload.knowledge) {
      return {
        ok: false,
        error: "Server hat kein gespeichertes Firmenwissen zurückgegeben.",
      };
    }

    return { ok: true, knowledge: payload.knowledge };
  } catch {
    return {
      ok: false,
      error: "Verbindung zum Server fehlgeschlagen. Bitte später erneut versuchen.",
    };
  }
}

async function hydrateCompanyKnowledge(
  companyId: string
): Promise<CompanyKnowledgeLoadResult> {
  if (useInMemoryPersistence()) {
    const cached = memoryByCompany.get(companyId);
    const knowledge = cached ?? seedForCompany(companyId);
    setCachedKnowledge(knowledge);
    hydratedCompanies.add(companyId);
    return { ok: true, knowledge, source: "memory" };
  }

  const remote = await fetchKnowledgeFromApi();
  if (!remote.ok) {
    loadErrors.set(companyId, remote.error);
    return remote;
  }

  if (remote.knowledge) {
    const knowledge = setCachedKnowledge({
      ...remote.knowledge,
      companyId,
    });
    clearLegacyLocalStorage(companyId);
    hydratedCompanies.add(companyId);
    notify();
    return { ok: true, knowledge, source: "supabase" };
  }

  const legacy = readLegacyLocalStorage(companyId);
  if (legacy) {
    const migrated = await saveKnowledgeToApi(legacy);
    if (migrated.ok) {
      const knowledge = setCachedKnowledge({
        ...migrated.knowledge,
        companyId,
      });
      clearLegacyLocalStorage(companyId);
      hydratedCompanies.add(companyId);
      notify();
      return { ok: true, knowledge, source: "migrated" };
    }

    loadErrors.set(companyId, migrated.error);
    return migrated;
  }

  const knowledge = setCachedKnowledge(seedForCompany(companyId));
  hydratedCompanies.add(companyId);
  notify();
  return { ok: true, knowledge, source: "empty" };
}

export function subscribeCompanyKnowledgeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isCompanyKnowledgeLoading(companyId: string): boolean {
  return loadingCompanies.has(companyId);
}

export function getCompanyKnowledgeLoadError(companyId: string): string | null {
  return loadErrors.get(companyId) ?? null;
}

export async function ensureCompanyKnowledgeLoaded(
  companyId: string
): Promise<CompanyKnowledgeLoadResult> {
  const inflight = hydrationPromises.get(companyId);
  if (inflight) {
    return inflight;
  }

  if (hydratedCompanies.has(companyId)) {
    const cached = memoryByCompany.get(companyId);
    if (cached) {
      return {
        ok: true,
        knowledge: cloneCompanyKnowledge(cached),
        source: "memory",
      };
    }
  }

  loadingCompanies.add(companyId);
  const promise = hydrateCompanyKnowledge(companyId).finally(() => {
    loadingCompanies.delete(companyId);
    hydrationPromises.delete(companyId);
  });

  hydrationPromises.set(companyId, promise);
  return promise;
}

export function getCompanyKnowledge(companyId: string): CompanyKnowledge {
  const cached = memoryByCompany.get(companyId);
  if (cached) return cloneCompanyKnowledge(cached);
  return seedForCompany(companyId);
}

export function getCompanyKnowledgeSnapshot(companyId: string): CompanyKnowledge {
  return getCompanyKnowledge(companyId);
}

export async function saveCompanyKnowledge(
  knowledge: CompanyKnowledge,
  updatedBy: string
): Promise<CompanyKnowledgeSaveResult> {
  const next: CompanyKnowledge = {
    ...cloneCompanyKnowledge(knowledge),
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy.trim() || knowledge.updatedBy,
  };

  if (useInMemoryPersistence()) {
    const saved = setCachedKnowledge(next);
    hydratedCompanies.add(next.companyId);
    notify();
    return { ok: true, knowledge: saved };
  }

  const remote = await saveKnowledgeToApi(next);
  if (!remote.ok) {
    loadErrors.set(next.companyId, remote.error);
    notify();
    return remote;
  }

  const saved = setCachedKnowledge({
    ...remote.knowledge,
    companyId: next.companyId,
  });
  clearLegacyLocalStorage(next.companyId);
  hydratedCompanies.add(next.companyId);
  notify();
  return { ok: true, knowledge: saved };
}

export function resetCompanyKnowledgeDraftSource(
  companyId: string
): CompanyKnowledge {
  return getCompanyKnowledge(companyId);
}
