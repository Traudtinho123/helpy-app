"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/auth";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { SKILL_ACCESS_CONTACT_EMAIL } from "@/lib/auth/skill-access-constants";

type PendingAccessContentProps = {
  email: string | null;
};

export function PendingAccessContent({ email }: PendingAccessContentProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.push(AUTH_ROUTES.login);
    router.refresh();
  };

  const mailto = `mailto:${SKILL_ACCESS_CONTACT_EMAIL}?subject=${encodeURIComponent(
    "HELPY Freischaltung"
  )}&body=${encodeURIComponent(
    email
      ? `Hallo,\n\nich habe mich mit ${email} registriert und warte auf die Freischaltung meines HELPY-Pakets.\n\nVielen Dank.`
      : "Hallo,\n\nich warte auf die Freischaltung meines HELPY-Pakets.\n\nVielen Dank."
  )}`;

  return (
    <div className="space-y-5">
      <div className="rounded-[16px] border border-[#BFDBFE]/70 bg-[#EFF6FF]/60 px-4 py-4">
        <p className="text-[13px] leading-relaxed text-[#334155]">
          Nach Eingang deiner Zahlung schalten wir dein HELPY-Produkt manuell
          frei. Das dauert in der Regel nur kurz.
        </p>
        {email ? (
          <p className="mt-3 text-[12px] text-[#64748B]">
            Angemeldet als{" "}
            <span className="font-medium text-[#0F172A]">{email}</span>
          </p>
        ) : null}
      </div>

      <a
        href={mailto}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[13px] font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)]"
      >
        <Mail className="size-4" />
        Kontakt aufnehmen
      </a>

      <p className="text-center text-[12px] text-[#64748B]">
        Oder schreib an{" "}
        <a
          href={`mailto:${SKILL_ACCESS_CONTACT_EMAIL}`}
          className="font-semibold text-[#2563EB] hover:underline"
        >
          {SKILL_ACCESS_CONTACT_EMAIL}
        </a>
      </p>

      <Button
        type="button"
        variant="outline"
        disabled={isSigningOut}
        onClick={() => void handleSignOut()}
        className="h-11 w-full rounded-[14px] border-[#CBD5E1]/70 text-[13px]"
      >
        {isSigningOut ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Abmelden…
          </>
        ) : (
          <>
            <LogOut className="size-4" />
            Abmelden
          </>
        )}
      </Button>
    </div>
  );
}
