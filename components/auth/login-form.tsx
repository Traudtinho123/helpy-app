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
      // Middleware prüft erneut
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
            className="font-semibold text-[var(--color-primary)] hover:underline"
          >
            Registrieren
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-[var(--text-sm)] font-medium text-[var(--color-ink-2)]"
          >
            E-Mail
          </label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--color-ink-4)]" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@unternehmen.de"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-[var(--text-sm)] font-medium text-[var(--color-ink-2)]"
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
          />
        </div>

        {error && (
          <p className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] bg-[var(--color-danger-light)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="w-full">
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

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--color-border)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--color-surface)] px-3 text-[var(--text-xs)] font-medium text-[var(--color-ink-4)]">
            oder
          </span>
        </div>
      </div>

      <GoogleAuthButton />
    </AuthPageShell>
  );
}
