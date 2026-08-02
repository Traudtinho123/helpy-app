export {
  buildCoreNavItems,
  CORE_NAV_GROUPS,
  CORE_NAV_SETTINGS,
  isSettingsRoute,
  resolveCoreNavActiveHref,
  resolveSettingsNavActiveHref,
  SETTINGS_NAV_ITEMS,
  SKILL_PORTFOLIO_DESCRIPTION,
  SKILL_PORTFOLIO_NAV,
} from "@/lib/navigation/core-navigation";

export type {
  CoreNavGroupId,
  CoreNavItem,
  CoreNavItemId,
  NavBrandIconId,
  SettingsNavItem,
} from "@/lib/navigation/core-navigation";

export {
  buildMobileMoreNavItems,
  buildMobileTabItems,
  MOBILE_SETTINGS_NAV_ITEMS,
  resolveMobileActiveTab,
} from "@/lib/navigation/mobile-navigation";

export type {
  MobileMoreNavItem,
  MobileSettingsNavItem,
  MobileTabId,
  MobileTabItem,
} from "@/lib/navigation/mobile-navigation";
