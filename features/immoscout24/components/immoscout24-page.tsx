"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** ImmoScout24-Anfragen leben als Vorgänge — Weiterleitung zum Plattformen-Filter. */
export function ImmoScout24Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/vorgaenge?filter=plattformen");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <p className="text-[13px] text-[var(--text-secondary)]">
        ImmoScout24-Anfragen werden geladen …
      </p>
    </div>
  );
}
