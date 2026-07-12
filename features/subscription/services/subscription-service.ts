import { getCompanyProfile } from "@/lib/company/company-profile-service";
import { MOCK_COMPANY_SUBSCRIPTION } from "@/features/subscription/mock/subscription-mock";
import type {
  CompanySubscription,
  SkillAccessState,
} from "@/features/subscription/types/subscription-types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { buildSkillRecord } from "@/features/workspace/services/skills/skill-defaults";
import { HELPY_SKILL_ORDER } from "@/features/workspace/services/workspace/skills";

const SUBSCRIPTION_CHANGE_EVENT = "helpy-subscription-change";

const listeners = new Set<() => void>();

/** DB-hydratisierte Freischaltung (Client). null = noch nicht geladen / kein Zugang. */
let databaseAllowedSkills: HelpySkill[] | null = null;
let databaseActiveSkill: HelpySkill | null = null;
let databaseHydrated = false;

const DEFAULT_SKILL_ACCESS_SERVER_SNAPSHOT: SkillAccessState = {
  subscription: MOCK_COMPANY_SUBSCRIPTION,
  skillConfirmed: true,
  hasDatabaseAccess: true,
};

let skillAccessSnapshot: SkillAccessState = DEFAULT_SKILL_ACCESS_SERVER_SNAPSHOT;

let cachedCompanySubscription: CompanySubscription = {
  ...MOCK_COMPANY_SUBSCRIPTION,
};

function planNameForSkill(skill: HelpySkill): string {
  switch (skill) {
    case "construction":
      return "HELPY Construction";
    case "consulting-legal":
      return "HELPY Consulting & Legal";
    case "real-estate":
    default:
      return "HELPY Real Estate";
  }
}

function buildCompanySubscription(): CompanySubscription {
  const company = getCompanyProfile();
  const active =
    databaseActiveSkill ?? company.activePaidSkill ?? MOCK_COMPANY_SUBSCRIPTION.activePaidSkill;
  const allowed =
    databaseAllowedSkills && databaseAllowedSkills.length > 0
      ? databaseAllowedSkills
      : [active];

  return {
    companyId: company.companyId,
    planName: planNameForSkill(active),
    activePaidSkill: active,
    allowedSkills: allowed,
    lockedSkills: HELPY_SKILL_ORDER.filter((skill) => !allowed.includes(skill)),
    status: allowed.length > 0 ? "active" : "inactive",
  };
}

function recomputeSkillAccessSnapshot(): SkillAccessState {
  const subscription = buildCompanySubscription();
  const hasDatabaseAccess =
    databaseHydrated && (databaseAllowedSkills?.length ?? 0) > 0;
  // Zugang gilt als „bestätigt“, sobald DB einen Skill liefert (kein lokaler Picker mehr).
  const skillConfirmed = !databaseHydrated || hasDatabaseAccess;

  if (
    skillAccessSnapshot.skillConfirmed === skillConfirmed &&
    skillAccessSnapshot.hasDatabaseAccess === hasDatabaseAccess &&
    skillAccessSnapshot.subscription.companyId === subscription.companyId &&
    skillAccessSnapshot.subscription.activePaidSkill ===
      subscription.activePaidSkill &&
    skillAccessSnapshot.subscription.allowedSkills.join() ===
      subscription.allowedSkills.join()
  ) {
    return skillAccessSnapshot;
  }

  cachedCompanySubscription = subscription;
  skillAccessSnapshot = {
    subscription,
    skillConfirmed,
    hasDatabaseAccess,
  };

  return skillAccessSnapshot;
}

function notify(): void {
  recomputeSkillAccessSnapshot();
  listeners.forEach((listener) => listener());
}

export function subscribeSubscription(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Setzt Freischaltung aus profiles.allowed_skills (via /api/skill-access).
 */
export function applyDatabaseSkillAccess(
  allowedSkills: HelpySkill[],
  activeSkill: HelpySkill
): void {
  databaseAllowedSkills = [...allowedSkills];
  databaseActiveSkill = activeSkill;
  databaseHydrated = true;
  notify();
  if (typeof window !== "undefined") {
    window.localStorage.setItem("helpy-active-skill", activeSkill);
    window.dispatchEvent(new Event(SUBSCRIPTION_CHANGE_EVENT));
    window.dispatchEvent(new Event("helpy-skill-change"));
  }
}

/** Kein freigeschalteter Skill (oder Logout). */
export function clearDatabaseSkillAccess(): void {
  databaseAllowedSkills = [];
  databaseActiveSkill = null;
  databaseHydrated = true;
  notify();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SUBSCRIPTION_CHANGE_EVENT));
  }
}

export function getCompanySubscription(): CompanySubscription {
  if (typeof window === "undefined") {
    return MOCK_COMPANY_SUBSCRIPTION;
  }

  recomputeSkillAccessSnapshot();
  return cachedCompanySubscription;
}

export function getActivePaidSkill(): HelpySkill {
  if (databaseActiveSkill) return databaseActiveSkill;
  return getCompanyProfile().activePaidSkill;
}

export function isSkillAllowed(skill: HelpySkill): boolean {
  if (databaseHydrated && databaseAllowedSkills) {
    return databaseAllowedSkills.includes(skill);
  }
  return getCompanySubscription().allowedSkills.includes(skill);
}

export function isSkillLocked(skill: HelpySkill): boolean {
  return !isSkillAllowed(skill);
}

/** @deprecated Skill-Picker entfernt — immer true wenn DB-Zugang besteht. */
export function isSkillConfirmed(): boolean {
  if (!databaseHydrated) return true;
  return (databaseAllowedSkills?.length ?? 0) > 0;
}

export function getSkillAccessState(): SkillAccessState {
  if (typeof window === "undefined") {
    return DEFAULT_SKILL_ACCESS_SERVER_SNAPSHOT;
  }

  return recomputeSkillAccessSnapshot();
}

/** @deprecated Kein Self-Service-Picker mehr — no-op für Kompatibilität. */
export function confirmActiveSkill(): HelpySkill {
  const skill = getActivePaidSkill();
  notify();
  return skill;
}

/** Nur für Tests / Entwicklung. */
export function resetSkillConfirmation(): void {
  clearDatabaseSkillAccess();
}

export function subscribeSkillAccess(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handler);
    window.addEventListener(SUBSCRIPTION_CHANGE_EVENT, handler);
  }

  const unsubscribe = subscribeSubscription(handler);

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handler);
      window.removeEventListener(SUBSCRIPTION_CHANGE_EVENT, handler);
    }
    unsubscribe();
  };
}

export function getSkillAccessServerSnapshot(): SkillAccessState {
  return DEFAULT_SKILL_ACCESS_SERVER_SNAPSHOT;
}

const DEFAULT_INTEGRATION_PRIORITY = [
  "gmail",
  "website-formulare",
  "apple-calendar",
  "google-calendar",
];

export const SKILL_INTEGRATION_PRIORITY: Record<HelpySkill, string[]> =
  buildSkillRecord(
    {
      "real-estate": [
        "gmail",
        "immoscout24",
        "homegate",
        "newhome",
        "website-formulare",
        "apple-calendar",
        "google-calendar",
      ],
      construction: [
        "gmail",
        "whatsapp",
        "website-formulare",
        "apple-calendar",
        "google-calendar",
      ],
      "consulting-legal": [
        "gmail",
        "website-formulare",
        "apple-calendar",
        "google-calendar",
      ],
    },
    DEFAULT_INTEGRATION_PRIORITY
  );

const DEFAULT_CATEGORY_ORDER: import("@/features/integration-manager/types/integration-types").IntegrationCategory[] =
  [
    "email",
    "kalender",
    "kommunikation",
    "formulare",
    "dokumente",
    "immobilien",
    "buchhaltung",
    "finanzen",
    "sap",
    "sozial-media",
  ];

export const SKILL_CATEGORY_ORDER: Record<
  HelpySkill,
  import("@/features/integration-manager/types/integration-types").IntegrationCategory[]
> = buildSkillRecord(
  {
    "real-estate": [
      "email",
      "kalender",
      "immobilien",
      "sozial-media",
      "kommunikation",
      "formulare",
      "dokumente",
      "buchhaltung",
      "finanzen",
      "sap",
    ],
    construction: [
      "email",
      "kalender",
      "kommunikation",
      "formulare",
      "dokumente",
      "immobilien",
      "buchhaltung",
      "finanzen",
      "sap",
      "sozial-media",
    ],
    "consulting-legal": [
      "email",
      "kalender",
      "formulare",
      "dokumente",
      "kommunikation",
      "buchhaltung",
      "finanzen",
      "sap",
      "immobilien",
      "sozial-media",
    ],
  },
  DEFAULT_CATEGORY_ORDER
);

export function sortIntegrationsForSkill<T extends { id: string }>(
  items: T[],
  skill: HelpySkill
): T[] {
  const priority = SKILL_INTEGRATION_PRIORITY[skill];
  const rank = new Map(priority.map((id, index) => [id, index]));

  return [...items].sort((a, b) => {
    const rankA = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return 0;
  });
}

export function isPriorityIntegration(
  integrationId: string,
  skill: HelpySkill
): boolean {
  return SKILL_INTEGRATION_PRIORITY[skill].includes(integrationId);
}

export function getAllSkillsForDisplay(): HelpySkill[] {
  return [...HELPY_SKILL_ORDER];
}
