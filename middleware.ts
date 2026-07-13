import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_ROUTES,
  isOnboardingRoute,
  isPendingAccessRoute,
  isProtectedRoute,
} from "@/lib/auth/routes";
import { normalizeAllowedSkills } from "@/lib/auth/skill-access-shared";
import { onboardingStepPath } from "@/lib/onboarding/constants";
import { nextOnboardingStepAfter } from "@/lib/onboarding/constants";
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
      .select("allowed_skills, company_id")
      .eq("id", user.id)
      .maybeSingle();

    const allowed = normalizeAllowedSkills(
      profile?.allowed_skills as string[] | null | undefined
    );
    const target = request.nextUrl.clone();
    target.search = "";

    if (allowed.length === 0) {
      target.pathname = AUTH_ROUTES.welcome;
      return NextResponse.redirect(target);
    }

    if (profile?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("onboarding_completed, onboarding_step")
        .eq("id", profile.company_id)
        .maybeSingle();

      if (!company?.onboarding_completed) {
        target.pathname = onboardingStepPath(
          nextOnboardingStepAfter(company?.onboarding_step ?? 0)
        );
        return NextResponse.redirect(target);
      }
    }

    target.pathname = AUTH_ROUTES.home;
    return NextResponse.redirect(target);
  }

  if (user && (isProtectedRoute(pathname) || isPendingAccessRoute(pathname) || isOnboardingRoute(pathname))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("allowed_skills, company_id")
      .eq("id", user.id)
      .maybeSingle();

    const allowed = normalizeAllowedSkills(
      profile?.allowed_skills as string[] | null | undefined
    );
    const hasAccess = allowed.length > 0;

    if (!hasAccess && isProtectedRoute(pathname)) {
      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = AUTH_ROUTES.welcome;
      pendingUrl.search = "";
      return NextResponse.redirect(pendingUrl);
    }

    if (!hasAccess && isOnboardingRoute(pathname)) {
      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = AUTH_ROUTES.welcome;
      pendingUrl.search = "";
      return NextResponse.redirect(pendingUrl);
    }

    if (hasAccess && isPendingAccessRoute(pathname)) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = AUTH_ROUTES.home;
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }

    if (hasAccess && profile?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("onboarding_completed, onboarding_step")
        .eq("id", profile.company_id)
        .maybeSingle();

      const onboardingCompleted = Boolean(company?.onboarding_completed);
      const onboardingStep = company?.onboarding_step ?? 0;

      if (!onboardingCompleted && isProtectedRoute(pathname)) {
        const onboardingUrl = request.nextUrl.clone();
        onboardingUrl.pathname = onboardingStepPath(
          nextOnboardingStepAfter(onboardingStep)
        );
        onboardingUrl.search = "";
        return NextResponse.redirect(onboardingUrl);
      }

      if (onboardingCompleted && isOnboardingRoute(pathname)) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = AUTH_ROUTES.home;
        homeUrl.search = "";
        return NextResponse.redirect(homeUrl);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
