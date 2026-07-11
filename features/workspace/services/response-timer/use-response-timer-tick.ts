"use client";

import { useEffect, useState } from "react";

const DEFAULT_TICK_MS = 60_000;

/** Clientseitiger Takt für Echtzeit-Anzeige ohne Reload. */
export function useResponseTimerTick(tickMs: number = DEFAULT_TICK_MS): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return now;
}
