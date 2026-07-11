"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

function maskToken(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length <= 10) return `${value}***`;
  return `${value.slice(0, 10)}...***`;
}

export default function DebugSessionPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoaded(true);
      return;
    }

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoaded(true);
    });
  }, []);

  const providerToken = session?.provider_token ?? null;
  const providerRefreshToken = session?.provider_refresh_token ?? null;

  if (!loaded) {
    return (
      <main style={{ padding: 24, fontFamily: "monospace" }}>
        Lade Session…
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace", lineHeight: 1.8 }}>
      <h1>/debug/session</h1>
      <p>Entwickler-Debug — Google Provider Token</p>
      <hr />
      <p>Eingeloggt: {session ? "Ja" : "Nein"}</p>
      <p>User E-Mail: {session?.user?.email ?? "—"}</p>
      <p>Provider: {session?.user?.app_metadata?.provider ?? "—"}</p>
      <p>Provider Token vorhanden: {providerToken ? "Ja" : "Nein"}</p>
      {providerToken && (
        <p>Provider Token (Vorschau): {maskToken(providerToken)}</p>
      )}
      <p>
        Provider Refresh Token vorhanden: {providerRefreshToken ? "Ja" : "Nein"}
      </p>
      {providerRefreshToken && (
        <p>
          Provider Refresh Token (Vorschau): {maskToken(providerRefreshToken)}
        </p>
      )}
      {!providerToken && (
        <p>
          Kein Google Provider Token gefunden. Bitte neu mit Google anmelden.
        </p>
      )}
    </main>
  );
}
