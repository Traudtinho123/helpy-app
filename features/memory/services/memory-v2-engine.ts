import {
  updateCustomerMemoryFromGmailBundle,
  updateCustomerMemoryFromGmailBundles,
  updateCustomerMemoryFromOffer,
} from "@/features/intelligence/memory-engine/memory-triggers";
import { processBackgroundMemoryFromGmailBundle } from "@/features/memory/services/background-memory-engine";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import {
  buildMemoryEnrichmentHints,
  buildMemoryPanelBullets,
} from "@/features/memory/services/customer-memory-enrichment";
import {
  crmCustomerToMemoryProfile,
  resolveCrmCustomerForVorgang,
} from "@/features/crm/services/crm-engine";
import {
  bootstrapCrmFromGmailCache,
  syncCrmFromGmailBundle,
  syncCrmFromGmailBundles,
  syncCrmFromWorkspaceVorgang,
} from "@/features/crm/services/crm-sync";
import { subscribeCrm } from "@/features/crm/services/crm-store";
import type {
  CustomerMemoryProfile,
  CustomerMemoryWorkspaceView,
} from "@/features/memory/types/customer-memory-types";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

export function resolveCustomerProfileForVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): CustomerMemoryProfile | null {
  const customer = resolveCrmCustomerForVorgang(vorgang, liste);
  return customer ? crmCustomerToMemoryProfile(customer) : null;
}

export function getCustomerMemoryWorkspaceView(
  vorgang: WorkspaceVorgang,
  _skill: HelpySkill,
  liste?: ListeVorgang
): CustomerMemoryWorkspaceView {
  const profile = resolveCustomerProfileForVorgang(vorgang, liste);
  const hints = buildMemoryEnrichmentHints(profile, vorgang.id);
  const panelBullets = buildMemoryPanelBullets(profile, hints);

  return {
    profile,
    hints,
    panelBullets,
  };
}

export function ingestGmailVorgangBundle(
  bundle: GmailVorgangBundle
): CustomerMemoryProfile | null {
  const customer = syncCrmFromGmailBundle(bundle);
  updateCustomerMemoryFromGmailBundle(bundle);
  processBackgroundMemoryFromGmailBundle(
    bundle,
    peekRealEstateObjectByVorgangId(bundle.liste.id)?.objectId ?? null
  );
  return customer ? crmCustomerToMemoryProfile(customer) : null;
}

export function ingestWorkspaceVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): CustomerMemoryProfile | null {
  const customer = syncCrmFromWorkspaceVorgang(vorgang, liste);
  const from = liste?.from ?? vorgang.letzteEmail.absender;
  const emailMatch = from.match(/<([^>]+)>/);
  const email =
    emailMatch?.[1]?.trim() ||
    (from.includes("@") ? from.trim() : vorgang.kunde.email);

  if (vorgang.angebot && email && email !== "—") {
    updateCustomerMemoryFromOffer({
      vorgangId: vorgang.id,
      email,
      angebot: vorgang.angebot,
    });
  }

  return customer ? crmCustomerToMemoryProfile(customer) : null;
}

export function ingestGmailVorgangBundles(bundles: GmailVorgangBundle[]): void {
  syncCrmFromGmailBundles(bundles);
  updateCustomerMemoryFromGmailBundles(bundles);
}

export function bootstrapCustomerMemoryFromGmailCache(
  vorgaenge: ListeVorgang[],
  workspaces: Record<string, WorkspaceVorgang>
): void {
  bootstrapCrmFromGmailCache(vorgaenge, workspaces);
}

export { subscribeCrm as subscribeCustomerMemory };

export function getHistoryByType(
  profile: CustomerMemoryProfile,
  types: CustomerMemoryProfile["history"][number]["type"][]
) {
  return profile.history.filter((item) => types.includes(item.type));
}
