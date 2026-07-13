import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { buildCoreNavItems, SKILL_PORTFOLIO_NAV } from "@/lib/navigation/core-navigation";

export type MobileTabId = "heute" | "vorgaenge" | "kunden" | "kalender" | "mehr";

export type MobileTabItem = {
  id: MobileTabId;
  label: string;
  emoji: string;
  href?: string;
  showMailBadge?: boolean;
};

export type MobileMoreNavItem = {
  label: string;
  emoji: string;
  href: string;
};

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

  return [
    { label: portfolio.label, emoji: portfolio.emoji, href: "/objekte" },
    { label: "Dokumente", emoji: "📄", href: "/dokumente" },
    { label: "Helpy-Phone", emoji: "📞", href: "/telefonie" },
    { label: "WhatsApp", emoji: "💬", href: "/whatsapp" },
    { label: "Einstellungen", emoji: "⚙️", href: "/einstellungen" },
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
    "/objekte",
    "/objekt/",
    "/dokumente",
    "/telefonie",
    "/telefonassistent",
    "/whatsapp",
    "/einstellungen",
    "/plattformen",
    "/posteingang",
  ];
  if (morePaths.some((prefix) => pathname.startsWith(prefix))) {
    return "mehr";
  }

  const match = tabs.find((tab) => tab.href && pathname.startsWith(tab.href));
  if (match) return match.id;
  return "heute";
}
