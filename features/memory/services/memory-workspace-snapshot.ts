import { buildIntelligencePanelBullets } from "@/features/intelligence/memory-engine/memory-engine";
import {
  buildCustomerIdFromEmail,
  getIntelligenceCustomerMemory,
} from "@/features/intelligence/customer-memory/customer-memory-store";
import {
  buildMemoryEnrichmentHints,
  buildMemoryPanelBullets,
} from "@/features/memory/services/customer-memory-enrichment";
import { crmCustomerToMemoryProfile } from "@/features/crm/services/crm-engine";
import { peekCrmCustomerByMatch } from "@/features/crm/services/crm-store";
import type { CustomerMemoryWorkspaceView } from "@/features/memory/types/customer-memory-types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

const EMPTY_MEMORY_VIEW: CustomerMemoryWorkspaceView = {
  profile: null,
  hints: [],
  panelBullets: [],
};

type CachedMemoryView = CustomerMemoryWorkspaceView & {
  cacheKey: string;
};

const snapshots = new Map<string, CachedMemoryView>();

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

export function getCustomerMemoryWorkspaceViewSnapshot(
  vorgang: WorkspaceVorgang,
  _skill: HelpySkill,
  liste?: ListeVorgang
): CustomerMemoryWorkspaceView {
  const email = extractEmailFromVorgang(vorgang, liste);
  const customer = peekCrmCustomerByMatch({
    email,
    telefon: vorgang.kunde.telefon,
    firma: vorgang.kunde.firmenname,
    ansprechpartner: vorgang.kunde.ansprechpartner,
  });

  const intelligenceMemory = email
    ? getIntelligenceCustomerMemory(buildCustomerIdFromEmail(email))
    : null;

  const cacheKey = buildCacheKey(
    vorgang.id,
    customer?.id ?? null,
    intelligenceMemory?.lastUpdated ?? customer?.updatedAt ?? null
  );

  const cached = snapshots.get(vorgang.id);
  if (cached?.cacheKey === cacheKey) {
    return cached;
  }

  const profile = customer ? crmCustomerToMemoryProfile(customer) : null;
  const hints = buildMemoryEnrichmentHints(profile, vorgang.id);
  const intelligenceBullets = buildIntelligencePanelBullets(intelligenceMemory);
  const panelBullets =
    intelligenceBullets.length > 0
      ? intelligenceBullets
      : buildMemoryPanelBullets(profile, hints).slice(0, 5);

  const view: CachedMemoryView = {
    profile,
    hints,
    panelBullets,
    cacheKey,
  };

  snapshots.set(vorgang.id, view);
  return view;
}

export function getCustomerMemoryWorkspaceViewServerSnapshot(): CustomerMemoryWorkspaceView {
  return EMPTY_MEMORY_VIEW;
}

export function invalidateMemoryWorkspaceSnapshots(): void {
  snapshots.clear();
}

export { EMPTY_MEMORY_VIEW };
