import { NextResponse } from "next/server";
import {
  fetchOnboardingStateForUser,
  updateOnboardingState,
} from "@/lib/onboarding/onboarding-repository";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      companyId: "dev-company",
      companyName: "Demo Firma",
      industry: "Immobilien",
      onboardingCompleted: false,
      onboardingStep: 0,
      vorname: "Viktor",
      dev: true,
    });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const state = await fetchOnboardingStateForUser(user.id);
  if (!state) {
    return NextResponse.json({ error: "Kein Firmenprofil." }, { status: 404 });
  }

  return NextResponse.json(state);
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, dev: true });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const state = await fetchOnboardingStateForUser(user.id);
  if (!state) {
    return NextResponse.json({ error: "Kein Firmenprofil." }, { status: 404 });
  }

  let body: {
    onboardingStep?: number;
    onboardingCompleted?: boolean;
    companyName?: string;
    industry?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const ok = await updateOnboardingState({
    companyId: state.companyId,
    onboardingStep: body.onboardingStep,
    onboardingCompleted: body.onboardingCompleted,
    companyName: body.companyName?.trim(),
    industry: body.industry?.trim(),
  });

  if (!ok) {
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
