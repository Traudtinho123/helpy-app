<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:store-stability-rules -->
# Store Stability (HELPY v1)

Before using `useExternalStore` / `useSyncExternalStore`, read `docs/store-stability.md`.

- Detail pages: `useStoreRevision` + `useMemo` — never `useExternalStore`
- Live stores only: Gmail sync, notifications, workspace context provider
- Stable empty constants: `lib/store/stability-constants.ts`
<!-- END:store-stability-rules -->

<!-- BEGIN:persistence-rules -->
# Client Persistence (HELPY v1)

Before adding or changing a client store that holds user edits, read `docs/store-stability.md` §6.

- User mutations: `localStorage` via `lib/store/persistent-client-storage.ts` — never `sessionStorage`
- Saved records win over mock/seed on reload (match by stable id, e.g. `objectId`)
- Supabase sync when a table exists; `localStorage` remains fallback
<!-- END:persistence-rules -->
