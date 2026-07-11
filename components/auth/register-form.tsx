"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpWithEmail } from "@/lib/auth/auth";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setIsLoading(true);

    const { error: authError } = await signUpWithEmail(email, password);

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
        const accessResponse = await fetch("/api/skill-access", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (accessResponse.ok) {
          const data = (await accessResponse.json()) as { hasAccess?: boolean };
          router.push(
            data.hasAccess ? AUTH_ROUTES.home : AUTH_ROUTES.pendingAccess
          );
          router.refresh();
          return;
        }
      } catch {
        // Fallback Home — Middleware prüft erneut
      }
      router.push(AUTH_ROUTES.home);
      router.refresh();
      return;
    }

    setSuccess(
      "Konto erstellt. Bitte bestätige deine E-Mail-Adresse, bevor du dich anmeldest."
    );
    setIsLoading(false);

    setTimeout(() => {
      router.push(AUTH_ROUTES.login);
    }, 2500);
  };

  return (
    <AuthPageShell
      title="Konto erstellen"
      subtitle="Starte mit HELPY Office KI — dein KI-Bürokollege für den Alltag."
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
          <label
            htmlFor="register-email"
            className="text-[12px] font-medium text-[#334155]"
          >
            E-Mail
          </label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              id="register-email"
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
          <label
            htmlFor="register-password"
            className="text-[12px] font-medium text-[#334155]"
          >
            Passwort
          </label>
          <Input
            id="register-password"
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
          <label
            htmlFor="register-confirm"
            className="text-[12px] font-medium text-[#334155]"
          >
            Passwort bestätigen
          </label>
          <Input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort wiederholen"
            className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white text-[13px]"
          />
        </div>

        {error && (
          <p className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#DC2626]">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-[12px] border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-[12px] text-[#047857]">
            {success}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[13px] font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Konto wird erstellt…
            </>
          ) : (
            "Registrieren"
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
