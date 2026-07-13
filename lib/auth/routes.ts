export const AUTH_ROUTES = {
  login: "/login",
  register: "/registrieren",
  callback: "/auth/callback",
  welcome: "/willkommen",
  pendingAccess: "/willkommen",
  home: "/",
} as const;

/** Öffentliche Routen — kein Login erforderlich. */
export const PUBLIC_ROUTES = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.callback,
] as const;

/** Eingeloggt, wartet auf Freischaltung. */
export const PENDING_ACCESS_ROUTES = [AUTH_ROUTES.welcome] as const;

/** Onboarding-Flow (nach Freischaltung). */
export const ONBOARDING_ROUTE_PREFIX = "/onboarding";

export function isOnboardingRoute(pathname: string): boolean {
  return (
    pathname === ONBOARDING_ROUTE_PREFIX ||
    pathname.startsWith(`${ONBOARDING_ROUTE_PREFIX}/`)
  );
}

/** Routen, die später geschützt werden (Dashboard-Bereich). */
export const PROTECTED_ROUTE_PREFIXES = [
  "/",
  "/plattformen",
  "/vorgaenge",
  "/posteingang",
  "/immoscout24",
  "/kalender",
  "/telefonie",
  "/whatsapp",
  "/angebote",
  "/dokumente",
  "/kunden",
  "/objekte",
  "/objekt",
  "/aufgaben",
  "/analytics",
  "/einstellungen",
  "/vorgang",
  "/workspace",
] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isPendingAccessRoute(pathname: string): boolean {
  return PENDING_ACCESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isProtectedRoute(pathname: string): boolean {
  if (isPublicRoute(pathname)) return false;
  if (isPendingAccessRoute(pathname)) return false;
  if (isOnboardingRoute(pathname)) return false;

  return PROTECTED_ROUTE_PREFIXES.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

export function getAuthCallbackUrl(origin: string): string {
  return `${origin}${AUTH_ROUTES.callback}`;
}

export function getPostLoginRedirectUrl(origin: string): string {
  return `${origin}${AUTH_ROUTES.home}`;
}
