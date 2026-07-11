"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithEmail } from "@/lib/auth/auth";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const nextPath = searchParams.get("next") ?? AUTH_ROUTES.home;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    callbackError === "auth_callback"
      ? "Anmeldung fehlgeschlagen. Bitte erneut versuchen."
      : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: authError } = await signInWithEmail(email, password);

    if (authError) {
      setError(getAuthErrorMessage(authError));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/skill-access", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.ok) {
        const data = (await response.json()) as { hasAccess?: boolean };
        if (!data.hasAccess) {
          router.push(AUTH_ROUTES.pendingAccess);
          router.refresh();
          return;
        }
      }
    } catch {
      // Middleware prüft erneut — Fallback Home
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <AuthPageShell
      title="Willkommen zurück"
      subtitle="Melde dich an, um HELPY Office KI zu nutzen."
      showDataPrivacyBadge
      footer={
        <>
          Noch kein Konto?{" "}
          <Link
            href={AUTH_ROUTES.register}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            Registrieren
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-[12px] font-medium text-[#334155]"
          >
            E-Mail
          </label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              id="email"
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
            htmlFor="password"
            className="text-[12px] font-medium text-[#334155]"
          >
            Passwort
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white text-[13px]"
          />
        </div>

        {error && (
          <p className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#DC2626]">
            {error}
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
              HELPY meldet dich an…
            </>
          ) : (
            "Anmelden"
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

      <GoogleAuthButton />
    </AuthPageShell>
  );
}
