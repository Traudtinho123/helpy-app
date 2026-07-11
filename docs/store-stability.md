# HELPY Store Stability Rule v1

React-Snapshot-Loops entstehen, wenn `useSyncExternalStore` / `useExternalStore` mit instabilen `getSnapshot`-Referenzen kombiniert wird.

## 1. `useExternalStore` nur für echte Live-Stores

**Erlaubt:**
- Gmail Auto Sync (`gmail-sync-status`, Vorgänge-Panel)
- Notification Center (`HelpyNotificationBell`)
- Workspace Context Provider (zentrale Aggregation)
- Sidebar Gmail-Badge
- Interaktive Workspace-Karten mit Live-Bearbeitung (Antwort, Archiv, Termin)

**Nicht erlaubt:**
- Objektakte / Portfolio-Detailseiten
- Kundenakte-Detailseiten
- Dokument-Sektionen in Detailansichten
- Workspace Summary (nutzt Context + `useMemo`)
- Abgeleitete Berechnungen und statische Detailansichten

## 2. Detailseiten-Pattern

```tsx
import { useMemo } from "react";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { subscribeKundenakte, getKundenakteSnapshot } from "...";

const revision = useStoreRevision(subscribeKundenakte);
const kundenakte = useMemo(
  () => getKundenakteSnapshot(vorgangId),
  [vorgangId, revision]
);
```

## 3. Snapshot-Regeln (wenn `useExternalStore` nötig)

- Keine neuen Objekte/Arrays pro Aufruf
- Kein `map` / `filter` / `sort` / `reduce` / Spread in `getSnapshot`
- Kein `notify()` während Render oder in `getSnapshot`
- Fallbacks als Modul-Konstanten: `lib/store/stability-constants.ts`

## 4. `notify()`-Regeln

- Nur bei echten Datenänderungen
- Fingerprint vorher prüfen (`id`, `updatedAt`, `status`, `count`)
- Nicht beim bloßen Lesen
- **Nicht während Render:** Bootstrap/Seed aus `hydrateFromSession` / `getSnapshot` mit `{ notifySubscribers: false }` (siehe `seedRealEstateObjectsFromListeVorgaenge`, `ensurePortfolioSeed`)

## 5. Referenz-Implementierungen

- Detailseiten: `features/kundenakte/components/kundenakte-widget-grid.tsx`
- Stabile Snapshots: `features/kundenakte/services/kundenakte-store.ts`, `features/portfolio/services/portfolio-service.ts`

## 6. Persistenz-Regel (Nutzeränderungen)

**Nutzer-Mutationen müssen Logout, Login und Browser-Neustart überleben.**

| Erlaubt | Verboten für Nutzerdaten |
|---------|--------------------------|
| `localStorage` via `lib/store/persistent-client-storage.ts` | `sessionStorage` für bearbeitbare Felder |
| Supabase-Sync (wenn Tabelle vorhanden) | Mock/Seed-Daten überschreiben gespeicherte Objekte |
| Einmalige Migration sessionStorage → localStorage | Seed erneut anwenden wenn `objectId` bereits gespeichert |

**Bei jedem neuen Store mit Nutzeränderungen:**

1. `readPersistentJson` / `writePersistentJson` aus `lib/store/persistent-client-storage.ts` nutzen
2. Nach Login/Re-Hydration: gespeicherte Daten haben Vorrang vor Mock/Seed
3. Optional: Supabase-Upsert parallel (Fallback localStorage, siehe `completed-vorgaenge`)

**Referenz:** `features/real-estate/object/object-memory.ts`, `features/workspace/services/vorgaenge/completed-vorgaenge-store.ts`
