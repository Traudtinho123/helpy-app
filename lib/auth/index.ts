/**
 * Geschützte App-Routen — Vorbereitung für Sprint 7+.
 *
 * Aktivierung:
 * 1. In app/(dashboard)/layout.tsx `await requireAuth()` aufrufen
 * 2. Oder in middleware.ts bei isProtectedRoute() zu /login redirecten
 *
 * Beispiel Layout:
 *
 * ```tsx
 * import { requireAuth } from "@/lib/auth/require-auth";
 *
 * export default async function DashboardLayout({ children }) {
 *   await requireAuth();
 *   return <>{children}</>;
 * }
 * ```
 */

export { getAuthErrorMessage } from "@/lib/auth/errors";
export { requireAuth, redirectIfAuthenticated } from "@/lib/auth/require-auth";
export {
  requireSkillAccessApi,
  requireSkillAccessPage,
} from "@/lib/auth/require-skill-access";
export {
  getSkillAccessForCurrentUser,
  normalizeAllowedSkills,
  SKILL_ACCESS_CONTACT_EMAIL,
} from "@/lib/auth/skill-access";
export { getSession, getUser, isAuthenticated } from "@/lib/auth/session";
export {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
} from "@/lib/auth/auth";
export {
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  PENDING_ACCESS_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
  isPublicRoute,
  isPendingAccessRoute,
  isProtectedRoute,
} from "@/lib/auth/routes";
