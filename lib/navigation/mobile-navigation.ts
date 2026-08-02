import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import {
  buildCoreNavItems,
  SKILL_PORTFOLIO_NAV,
  type NavBrandIconId,
} from "@/lib/navigation/core-navigation";

export type MobileTabId = "heute" | "vorgaenge" | "kunden" | "kalender" | "mehr";

export type MobileTabItem = {
  id: MobileTabId;
  label: string;
  emoji: string;
  href?: string;
  showMailBadge?: boolean;
};

export type MobileMoreNavItem =
  | {
      type: "link";
      label: string;
      emoji: string;
      href: string;
      brandIcon?: NavBrandIconId;
    }
  | { type: "divider" };

export function buildMobileTabItems(skill: HelpySkill): MobileTabItem[] {
  const navItems = buildCoreNavItems(skill);
  const vorgaenge = navItems.find((item) => item.id === "vorgaenge");
  const kunden = navItems.find((item) => item.id === "kunden");
  const kalender = navItems.find((item) => item.id === "kalender");

  return [
    { id: "heute", label: "Heute", emoji: "🏠", href: "/" },
    {
      id: "vorgaenge",
      label: "Vorgänge",
      emoji: "📋",
      href: vorgaenge?.href ?? "/vorgaenge",
      showMailBadge: true,
    },
    {
      id: "kunden",
      label: kunden?.label ?? "Kunden",
      emoji: "👥",
      href: kunden?.href ?? "/kunden",
    },
    {
      id: "kalender",
      label: kalender?.label ?? "Kalender",
      emoji: "📅",
      href: kalender?.href ?? "/kalender",
    },
    { id: "mehr", label: "Mehr", emoji: "⋯" },
  ];
}

export function buildMobileMoreNavItems(skill: HelpySkill): MobileMoreNavItem[] {
  const portfolio = SKILL_PORTFOLIO_NAV[skill];
  const kunden = buildCoreNavItems(skill).find((item) => item.id === "kunden");

  return [
    { type: "link", label: portfolio.label, emoji: portfolio.emoji, href: "/objekte" },
    {
      type: "link",
      label: kunden?.label ?? "Kunden",
      emoji: "👥",
      href: kunden?.href ?? "/kunden",
    },
    { type: "link", label: "Dokumente", emoji: "📄", href: "/dokumente" },
    { type: "divider" },
    { type: "link", label: "Helpy-Phone", emoji: "📞", href: "/telefonie" },
    {
      type: "link",
      label: "WhatsApp",
      emoji: "💬",
      href: "/whatsapp",
      brandIcon: "whatsapp",
    },
    { type: "link", label: "Social Media", emoji: "📱", href: "/social-media" },
    { type: "divider" },
    { type: "link", label: "Plattformen", emoji: "🔗", href: "/plattformen" },
    { type: "link", label: "Einstellungen", emoji: "⚙️", href: "/einstellungen" },
  ];
}

export function resolveMobileActiveTab(
  pathname: string,
  tabs: MobileTabItem[]
): MobileTabId {
  if (pathname === "/") return "heute";
  if (
    pathname.startsWith("/vorgaenge") ||
    pathname.startsWith("/workspace/") ||
    pathname.startsWith("/vorgang/")
  ) {
    return "vorgaenge";
  }
  if (pathname.startsWith("/kunden")) return "kunden";
  if (pathname.startsWith("/kalender")) return "kalender";

  const morePaths = [
    "/finanzen",
    "/pipeline",
    "/objekte",
    "/objekt/",
    "/dokumente",
    "/telefonie",
    "/telefonassistent",
    "/whatsapp",
    "/social-media",
    "/einstellungen",
    "/plattformen",
    "/posteingang",
    "/immoscout24",
  ];
  if (morePaths.some((prefix) => pathname.startsWith(prefix))) {
    return "mehr";
  }

  const match = tabs.find((tab) => tab.href && pathname.startsWith(tab.href));
  if (match) return match.id;
  return "heute";
}

export type MobileSettingsNavItem = {
  label: string;
  emoji: string;
  href: string;
  operatorOnly?: boolean;
  superAdminOnly?: boolean;
};

/** Mobile Einstellungen-Hub — alle Kategorien als antippbare Zeilen. */
export const MOBILE_SETTINGS_NAV_ITEMS: MobileSettingsNavItem[] = [
  { label: "Unternehmen", emoji: "🏢", href: "/einstellungen/unternehmen" },
  {
    label: "KI-Einstellungen",
    emoji: "🤖",
    href: "/einstellungen/unternehmen#ki-einstellungen",
  },
  { label: "Plattformen", emoji: "🔗", href: "/plattformen" },
  { label: "Helpy-Phone", emoji: "📞", href: "/telefonie" },
  { label: "Team", emoji: "👥", href: "/einstellungen/team" },
  {
    label: "Benachrichtigungen",
    emoji: "🔔",
    href: "/einstellungen/unternehmen#benachrichtigungen",
  },
  { label: "Datenschutz & AGB", emoji: "🛡️", href: "/einstellungen/datenschutz" },
  {
    label: "Skill-Zugang",
    emoji: "🔐",
    href: "/einstellungen/betreiber",
    operatorOnly: true,
  },
  { label: "Analytics", emoji: "📊", href: "/einstellungen/analytics" },
  {
    label: "Admin Panel",
    emoji: "🛡️",
    href: "/einstellungen/admin",
    superAdminOnly: true,
  },
];
