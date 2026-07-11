/**
 * Persistenz für clientseitige Stores mit Nutzeränderungen.
 *
 * Regel: Nutzer-Mutationen (Titel, Status, Erledigt, …) dürfen nicht in
 * sessionStorage landen — nur localStorage (+ optional Supabase-Sync).
 * sessionStorage-Einträge werden einmalig migriert und entfernt.
 */

export type PersistentClientStorageOptions = {
  storageKey: string;
  /** Früherer sessionStorage-Schlüssel (einmalige Migration). */
  legacySessionKey?: string;
  /** Früherer localStorage-Schlüssel (einmalige Migration). */
  legacyLocalKey?: string;
};

export function readPersistentJson<T>(
  options: PersistentClientStorageOptions
): T | null {
  if (typeof window === "undefined") return null;

  try {
    let raw = window.localStorage.getItem(options.storageKey);

    if (!raw && options.legacyLocalKey) {
      const legacyLocal = window.localStorage.getItem(options.legacyLocalKey);
      if (legacyLocal) {
        raw = legacyLocal;
        window.localStorage.setItem(options.storageKey, legacyLocal);
        window.localStorage.removeItem(options.legacyLocalKey);
      }
    }

    if (!raw && options.legacySessionKey) {
      const legacySession = window.sessionStorage.getItem(options.legacySessionKey);
      if (legacySession) {
        raw = legacySession;
        window.localStorage.setItem(options.storageKey, legacySession);
        window.sessionStorage.removeItem(options.legacySessionKey);
      }
    }

    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writePersistentJson<T>(
  options: PersistentClientStorageOptions,
  value: T
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(options.storageKey, JSON.stringify(value));
}

export function removePersistentJson(options: PersistentClientStorageOptions): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(options.storageKey);
  if (options.legacySessionKey) {
    window.sessionStorage.removeItem(options.legacySessionKey);
  }
  if (options.legacyLocalKey) {
    window.localStorage.removeItem(options.legacyLocalKey);
  }
}
