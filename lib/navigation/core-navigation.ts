import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { getTerm } from "@/features/workspace/services/terminology/get-term";

export type CoreNavItemId =
  | "arbeitstag"
  | "vorgaenge"
  | "kunden"
  | "portfolio"
  | "dokumente"
  | "kalender"
  | "telefonie"
  | "whatsapp"
  | "plattformen"
  | "einstellungen";

export type CoreNavGroupId = "arbeit" | "kommunikation" | "ressourcen";

export type CoreNavItem = {
  id: CoreNavItemId;
  label: string;
  emoji: string;
  href: string;
  section: "primary" | "settings";
  navGroup?: CoreNavGroupId;
  showMailCount?: boolean;
  showWhatsappCount?: boolean;
};

export const CORE_NAV_GROUPS: { id: CoreNavGroupId; label: string }[] = [
  { id: "arbeit", label: "Arbeit" },
  { id: "kommunikation", label: "Kommunikation" },
  { id: "ressourcen", label: "Ressourcen" },
];

export type SettingsNavItem = {
  id: string;
  label: string;
  emoji: string;
  href: string;
  /** Nur für HELPY-Betreiber sichtbar */
  operatorOnly?: boolean;
};

/** Portfolio-Emoji pro Skill (Label kommt aus Terminology). */
export const SKILL_PORTFOLIO_EMOJI: Record<HelpySkill, string> = {
  "real-estate": "🏡",
  construction: "🏗",
  "consulting-legal": "📂",
};

/** @deprecated Prefer getTerm(skill, "portfolioItem", { form: "plural" }) */
export const SKILL_PORTFOLIO_NAV: Record<
  HelpySkill,
  Pick<CoreNavItem, "label" | "emoji">
> = {
  "real-estate": { label: "Objekte", emoji: "🏡" },
  construction: { label: "Baustellen", emoji: "🏗" },
  "consulting-legal": { label: "Mandate", emoji: "📂" },
};

export const SKILL_PORTFOLIO_DESCRIPTION: Record<HelpySkill, string> = {
  "real-estate":
    "Portfolio des Unternehmens — Objektakte, Interessenten, Besichtigungen, Dokumente und Kommunikation.",
  construction:
    "Baustellenübersicht — Projekte, Offerten, Material und Termine.",
  "consulting-legal":
    "Mandatsübersicht — Projekte, Fristen, Dokumente und Kommunikation.",
};

const CORE_NAV_PRIMARY: Omit<CoreNavItem, "label" | "emoji">[] = [
  { id: "arbeitstag", href: "/", section: "primary", navGroup: "arbeit" },
  { id: "vorgaenge", href: "/vorgaenge", section: "primary", navGroup: "arbeit", showMailCount: true },
  { id: "kalender", href: "/kalender", section: "primary", navGroup: "arbeit" },
  { id: "plattformen", href: "/plattformen", section: "primary", navGroup: "kommunikation" },
  { id: "telefonie", href: "/telefonie", section: "primary", navGroup: "kommunikation" },
  { id: "whatsapp", href: "/whatsapp", section: "primary", navGroup: "kommunikation", showWhatsappCount: true },
  { id: "portfolio", href: "/objekte", section: "primary", navGroup: "ressourcen" },
  { id: "kunden", href: "/kunden", section: "primary", navGroup: "ressourcen" },
  { id: "dokumente", href: "/dokumente", section: "primary", navGroup: "ressourcen" },
];

const CORE_NAV_PRIMARY_STATIC: Record<
  Exclude<CoreNavItemId, "portfolio" | "kunden" | "einstellungen">,
  Pick<CoreNavItem, "label" | "emoji">
> = {
  arbeitstag: { label: "Mein Arbeitsplatz", emoji: "🏠" },
  vorgaenge: { label: "Vorgänge", emoji: "📥" },
  dokumente: { label: "Dokumente", emoji: "📄" },
  kalender: { label: "Kalender", emoji: "📅" },
  telefonie: { label: "Helpy-Phone", emoji: "📞" },
  whatsapp: { label: "Helpy-WhatsApp", emoji: "💬" },
  plattformen: { label: "Plattformen", emoji: "🔗" },
};

export const CORE_NAV_SETTINGS: CoreNavItem = {
  id: "einstellungen",
  label: "Einstellungen",
  emoji: "⚙️",
  href: "/einstellungen",
  section: "settings",
};

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: "unternehmen", label: "Unternehmen", emoji: "🏢", href: "/einstellungen/unternehmen" },
  { id: "team", label: "Team", emoji: "👥", href: "/einstellungen/team" },
  {
    id: "betreiber",
    label: "Skill-Zugang",
    emoji: "🔐",
    href: "/einstellungen/betreiber",
    operatorOnly: true,
  },
  { id: "analytics", label: "Analytics", emoji: "📊", href: "/einstellungen/analytics" },
  { id: "datenschutz", label: "Datenschutz", emoji: "🛡️", href: "/einstellungen/datenschutz" },
];

export function buildCoreNavItems(skill: HelpySkill): CoreNavItem[] {
  const primary = CORE_NAV_PRIMARY.map((item): CoreNavItem => {
    if (item.id === "portfolio") {
      return {
        ...item,
        label: getTerm(skill, "portfolioItem", { form: "plural" }),
        emoji: SKILL_PORTFOLIO_EMOJI[skill],
      };
    }

    if (item.id === "kunden") {
      return {
        ...item,
        label: getTerm(skill, "customer", { form: "plural" }),
        emoji: "👥",
      };
    }

    const labels =
      CORE_NAV_PRIMARY_STATIC[
        item.id as keyof typeof CORE_NAV_PRIMARY_STATIC
      ];

    return {
      ...item,
      label: labels.label,
      emoji: labels.emoji,
    };
  });

  return [...primary, CORE_NAV_SETTINGS];
}

const NAV_MATCHERS: Array<{ href: string; matches: (pathname: string) => boolean }> = [
  {
    href: CORE_NAV_SETTINGS.href,
    matches: (pathname) =>
      pathname.startsWith("/einstellungen") || pathname === "/analytics",
  },
  {
    href: "/objekte",
    matches: (pathname) =>
      pathname.startsWith("/objekte") || pathname.startsWith("/objekt/"),
  },
  {
    href: "/kunden",
    matches: (pathname) => pathname.startsWith("/kunden"),
  },
  {
    href: "/vorgaenge",
    matches: (pathname) =>
      pathname.startsWith("/vorgaenge") ||
      pathname.startsWith("/workspace/") ||
      pathname.startsWith("/vorgang/") ||
      pathname.startsWith("/aufgaben"),
  },
  {
    href: "/dokumente",
    matches: (pathname) =>
      pathname.startsWith("/dokumente") || pathname.startsWith("/angebote"),
  },
  {
    href: "/kalender",
    matches: (pathname) => pathname.startsWith("/kalender"),
  },
  {
    href: "/telefonie",
    matches: (pathname) =>
      pathname.startsWith("/telefonie") || pathname.startsWith("/telefonassistent"),
  },
  {
    href: "/whatsapp",
    matches: (pathname) => pathname.startsWith("/whatsapp"),
  },
  {
    href: "/plattformen",
    matches: (pathname) =>
      pathname.startsWith("/plattformen") ||
      pathname.startsWith("/posteingang") ||
      pathname.startsWith("/immoscout24"),
  },
  {
    href: "/",
    matches: (pathname) => pathname === "/",
  },
];

/** Ermittelt den aktiven Hauptnavigationspunkt anhand der aktuellen Route. */
export function resolveCoreNavActiveHref(pathname: string): string {
  for (const matcher of NAV_MATCHERS) {
    if (matcher.matches(pathname)) {
      return matcher.href;
    }
  }

  return "/";
}

export function isSettingsRoute(pathname: string): boolean {
  return pathname.startsWith("/einstellungen") || pathname === "/analytics";
}

export function resolveSettingsNavActiveHref(pathname: string): string {
  if (pathname.startsWith("/einstellungen/analytics") || pathname === "/analytics") {
    return "/einstellungen/analytics";
  }
  if (pathname.startsWith("/einstellungen/datenschutz")) {
    return "/einstellungen/datenschutz";
  }
  if (pathname.startsWith("/einstellungen/team")) {
    return "/einstellungen/team";
  }
  if (pathname.startsWith("/einstellungen/betreiber")) {
    return "/einstellungen/betreiber";
  }
  return "/einstellungen/unternehmen";
}
