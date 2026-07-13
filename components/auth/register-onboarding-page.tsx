"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpWithEmail } from "@/lib/auth/auth";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import {
  ONBOARDING_INDUSTRIES,
  resolveSkillFromIndustry,
} from "@/lib/onboarding/constants";
import { createClient } from "@/lib/supabase/client";

export function RegisterOnboardingPage() {
  const router = useRouter();
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("real-estate");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vorname.trim() || !nachname.trim() || !companyName.trim()) {
      setError("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }
    if (!acceptedTerms) {
      setError("Bitte AGB und Datenschutzerklärung akzeptieren.");
      return;
    }
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setIsLoading(true);
    const skill = resolveSkillFromIndustry(industry);
    const industryLabel =
      ONBOARDING_INDUSTRIES.find((item) => item.value === industry)?.label ??
      industry;

    const { error: authError } = await signUpWithEmail(email, password, {
      firma: companyName.trim(),
      vorname: vorname.trim(),
      nachname: nachname.trim(),
      skill,
      industry: industryLabel,
    });

    if (authError) {
      setError(getAuthErrorMessage(authError));
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const session = supabase
      ? (await supabase.auth.getSession()).data.session
      : null;

    if (session) {
      try {
        await fetch("/api/auth/register/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: companyName.trim(),
            skill,
            industry: industryLabel,
            vorname: vorname.trim(),
            nachname: nachname.trim(),
            email: email.trim(),
          }),
        });
      } catch {
        // trotzdem weiter
      }
      router.push(AUTH_ROUTES.welcome);
      router.refresh();
      return;
    }

    setIsLoading(false);
    router.push(AUTH_ROUTES.login);
  };

  return (
    <div className="onboarding-fonts min-h-[100dvh] bg-[#F7F6F2]">
      <div className="mx-auto grid min-h-[100dvh] max-w-6xl lg:grid-cols-2">
        <aside className="hidden flex-col justify-center px-10 py-12 lg:flex xl:px-16">
          <HelpyCharacter size={200} pose="wave" animated />
          <blockquote className="onboarding-display mt-10 max-w-md text-[1.75rem] leading-snug text-[#1E1B4B]">
            «HELPY hat mir täglich 2 Stunden gespart. Endlich Zeit für meine Kunden.»
          </blockquote>
          <p className="mt-4 text-[14px] text-[#64748B]">
            — Viktor T., Immobilienmakler, Visp
          </p>
        </aside>

        <section className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <HelpyCharacter size={100} pose="wave" animated />
            </div>

            <h1 className="onboarding-display text-[2rem] font-semibold text-[#1E1B4B] sm:text-[2.4rem]">
              Starte kostenlos.
            </h1>
            <p className="mt-2 text-[15px] text-[#64748B]">
              14 Tage testen · Keine Kreditkarte
            </p>

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  required
                  placeholder="Vorname *"
                  value={vorname}
                  onChange={(e) => setVorname(e.target.value)}
                  className="h-12 rounded-[14px] border-[#E7E5E4] bg-white"
                />
                <Input
                  required
                  placeholder="Nachname *"
                  value={nachname}
                  onChange={(e) => setNachname(e.target.value)}
                  className="h-12 rounded-[14px] border-[#E7E5E4] bg-white"
                />
              </div>
              <Input
                type="email"
                required
                placeholder="E-Mail *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-[14px] border-[#E7E5E4] bg-white"
              />
              <Input
                type="password"
                required
                minLength={8}
                placeholder="Passwort (min. 8 Zeichen) *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-[14px] border-[#E7E5E4] bg-white"
              />
              <Input
                required
                placeholder="Firmenname *"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-12 rounded-[14px] border-[#E7E5E4] bg-white"
              />
              <select
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="h-12 w-full rounded-[14px] border border-[#E7E5E4] bg-white px-3 text-[14px] text-[#1E1B4B] outline-none focus:border-[#4F46E5]"
              >
                {ONBOARDING_INDUSTRIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.emoji} {item.label}
                  </option>
                ))}
              </select>

              <label className="flex items-start gap-2 text-[13px] text-[#64748B]">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 accent-[#4F46E5]"
                />
                Ich akzeptiere die AGB und Datenschutzerklärung
              </label>

              {error ? (
                <p className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#DC2626]">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-[14px] bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-[15px] font-semibold text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Konto wird erstellt…
                  </>
                ) : (
                  "Konto erstellen →"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-[14px] text-[#64748B]">
              Bereits registriert?{" "}
              <Link href={AUTH_ROUTES.login} className="font-semibold text-[#4F46E5] hover:underline">
                Einloggen
              </Link>
            </p>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E7E5E4]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#F7F6F2] px-3 text-[12px] text-[#94A3B8]">oder</span>
              </div>
            </div>

            <GoogleAuthButton label="Mit Google registrieren" />
          </div>
        </section>
      </div>
    </div>
  );
}
