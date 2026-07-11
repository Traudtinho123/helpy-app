import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AUTH_ROUTES } from "@/lib/auth/routes";

type RequireAuthOptions = {
  redirectTo?: string;
};

/**
 * Server-seitiger Auth-Guard für geschützte Seiten.
 * Später in Layouts oder Page-Komponenten aufrufen:
 *
 * ```ts
 * export default async function Page() {
 *   await requireAuth();
 *   return <Dashboard />;
 * }
 * ```
 */
export async function requireAuth(options?: RequireAuthOptions) {
  const { session } = await getSession();

  if (!session) {
    redirect(options?.redirectTo ?? AUTH_ROUTES.login);
  }

  return session;
}

/**
 * Umgekehrter Guard für Login/Registrierung:
 * Eingeloggte Nutzer werden zum Dashboard weitergeleitet.
 */
export async function redirectIfAuthenticated(
  redirectTo: string = AUTH_ROUTES.home
) {
  const { session } = await getSession();

  if (session) {
    redirect(redirectTo);
  }
}
