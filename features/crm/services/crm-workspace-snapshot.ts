import type { CrmWorkspaceView } from "@/features/crm/types/crm-types";
import { peekCrmCustomerByMatch } from "@/features/crm/services/crm-store";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

const EMPTY_CRM_VIEW: CrmWorkspaceView = {
  customer: null,
  isNewCustomer: false,
};

type CachedCrmView = CrmWorkspaceView & {
  cacheKey: string;
};

const snapshots = new Map<string, CachedCrmView>();

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

function buildCacheKey(
  vorgangId: string,
  customerId: string | null,
  updatedAt: string | null
): string {
  return `${vorgangId}:${customerId ?? "none"}:${updatedAt ?? "none"}`;
}

export function getCrmWorkspaceViewSnapshot(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): CrmWorkspaceView {
  const email = extractEmailFromVorgang(vorgang, liste);
  const customer = peekCrmCustomerByMatch({
    email,
    telefon: vorgang.kunde.telefon,
    firma: vorgang.kunde.firmenname,
    ansprechpartner: vorgang.kunde.ansprechpartner,
  });

  const cacheKey = buildCacheKey(
    vorgang.id,
    customer?.id ?? null,
    customer?.updatedAt ?? null
  );

  const cached = snapshots.get(vorgang.id);
  if (cached?.cacheKey === cacheKey) {
    return cached;
  }

  const view: CachedCrmView = {
    customer: customer ? structuredClone(customer) : null,
    isNewCustomer: customer?.status === "neu",
    cacheKey,
  };

  snapshots.set(vorgang.id, view);
  return view;
}

export function getCrmWorkspaceViewServerSnapshot(): CrmWorkspaceView {
  return EMPTY_CRM_VIEW;
}

export function invalidateCrmWorkspaceSnapshots(): void {
  snapshots.clear();
}

export { EMPTY_CRM_VIEW };
