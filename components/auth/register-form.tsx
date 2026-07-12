"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { signUpWithEmail } from "@/lib/auth/auth";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";

const SKILL_OPTIONS = [
  { value: "real-estate", label: "Immobilien (HELPY Real Estate)" },
  { value: "construction", label: "Handwerk/Bau (HELPY Construction)" },
  { value: "consulting-legal", label: "Beratung/Recht (HELPY Consulting)" },
  { value: "friseur", label: "Beauty/Wellness (HELPY Friseur)" },
  { value: "other", label: "Anderes (wird geprüft)" },
] as const;

export function RegisterForm() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [skill, setSkill] = useState<string>("real-estate");
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!companyName.trim()) {
      setError("Bitte Firmenname eingeben.");
      return;
    }

    if (!vorname.trim() || !nachname.trim()) {
      setError("Bitte Vor- und Nachname eingeben.");
      return;
    }

    if (!acceptedTerms) {
      setError("Bitte AGB akzeptieren.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setIsLoading(true);

    const { error: authError } = await signUpWithEmail(email, password, {
      firma: companyName.trim(),
      vorname: vorname.trim(),
      nachname: nachname.trim(),
      skill,
      telefon: telefon.trim(),
    });

    if (authError) {
      setError(getAuthErrorMessage(authError));
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { session } } = supabase
      ? await supabase.auth.getSession()
      : { data: { session: null } };

    if (session) {
      try {
        await fetch("/api/auth/register/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: companyName.trim(),
            skill,
            vorname: vorname.trim(),
            nachname: nachname.trim(),
            email: email.trim(),
            telefon: telefon.trim() || null,
          }),
        });
      } catch {
        // Registrierung trotzdem als erfolgreich behandeln
      }

      setSuccess(
        "Danke für deine Registrierung! Wir schalten deinen Zugang innerhalb von 24h frei und melden uns bei dir."
      );
      setIsLoading(false);
      router.push(AUTH_ROUTES.pendingAccess);
      router.refresh();
      return;
    }

    setSuccess(
      "Konto erstellt. Bitte bestätige deine E-Mail-Adresse. Danach schalten wir deinen Zugang frei."
    );
    setIsLoading(false);

    setTimeout(() => {
      router.push(AUTH_ROUTES.login);
    }, 3000);
  };

  return (
    <AuthPageShell
      title="Firma registrieren"
      subtitle="Starte mit HELPY — dein KI-Bürokollege für deine Branche."
      footer={
        <>
          Bereits registriert?{" "}
          <Link
            href={AUTH_ROUTES.login}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            Anmelden
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[12px] font-medium text-[#334155]">
            Firmenname *
          </label>
          <Input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Traudt Immobilien AG"
            className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white text-[13px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-medium text-[#334155]">
            Branche / HELPY Skill *
          </label>
          <Select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="h-11 rounded-[14px]"
          >
            {SKILL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-[#334155]">
              Vorname *
            </label>
            <Input
              required
              value={vorname}
              onChange={(e) => setVorname(e.target.value)}
              className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white text-[13px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-[#334155]">
              Nachname *
            </label>
            <Input
              required
              value={nachname}
              onChange={(e) => setNachname(e.target.value)}
              className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white text-[13px]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-medium text-[#334155]">
            E-Mail (wird Firmen-Admin) *
          </label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@unternehmen.de"
              className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white pl-10 text-[13px]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-medium text-[#334155]">
            Telefon (optional)
          </label>
          <Input
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="+41 79 000 00 00"
            className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white text-[13px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-medium text-[#334155]">
            Passwort *
          </label>
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 8 Zeichen"
            className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white text-[13px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-medium text-[#334155]">
            Passwort bestätigen *
          </label>
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort wiederholen"
            className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white text-[13px]"
          />
        </div>

        <label className="flex items-start gap-2 text-[12px] text-[#64748B]">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5"
          />
          Ich akzeptiere die AGB und Datenschutzbestimmungen.
        </label>

        {error ? (
          <p className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#DC2626]">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-[12px] border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-[12px] text-[#047857]">
            {success}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[13px] font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Registrierung läuft…
            </>
          ) : (
            "Firma registrieren"
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#CBD5E1]/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white/85 px-3 text-[11px] font-medium text-[#94A3B8]">
            oder
          </span>
        </div>
      </div>

      <GoogleAuthButton label="Mit Google registrieren" />
    </AuthPageShell>
  );
}
