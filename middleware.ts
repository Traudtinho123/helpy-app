import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_ROUTES,
  isPendingAccessRoute,
  isProtectedRoute,
} from "@/lib/auth/routes";
import { normalizeAllowedSkills } from "@/lib/auth/skill-access-shared";
import {
  isSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = AUTH_ROUTES.login;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user && isPendingAccessRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = AUTH_ROUTES.login;
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (pathname === AUTH_ROUTES.login || pathname === AUTH_ROUTES.register)
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("allowed_skills")
      .eq("id", user.id)
      .maybeSingle();

    const allowed = normalizeAllowedSkills(
      profile?.allowed_skills as string[] | null | undefined
    );
    const target = request.nextUrl.clone();
    target.pathname =
      allowed.length > 0 ? AUTH_ROUTES.home : AUTH_ROUTES.pendingAccess;
    target.search = "";
    return NextResponse.redirect(target);
  }

  if (user && (isProtectedRoute(pathname) || isPendingAccessRoute(pathname))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("allowed_skills")
      .eq("id", user.id)
      .maybeSingle();

    const allowed = normalizeAllowedSkills(
      profile?.allowed_skills as string[] | null | undefined
    );
    const hasAccess = allowed.length > 0;

    if (!hasAccess && isProtectedRoute(pathname)) {
      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = AUTH_ROUTES.pendingAccess;
      pendingUrl.search = "";
      return NextResponse.redirect(pendingUrl);
    }

    if (hasAccess && isPendingAccessRoute(pathname)) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = AUTH_ROUTES.home;
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
