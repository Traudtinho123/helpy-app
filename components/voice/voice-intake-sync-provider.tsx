"use client";

import { useEffect, useRef } from "react";
import { notifyVoiceIntake } from "@/features/notifications/services/notification-emitter";
import {
  ackVoiceIntakes,
  fetchPendingVoiceIntakes,
} from "@/features/voice/services/voice-settings-client";
import {
  getVoiceVorgaenge,
  ingestVoiceProcessedCall,
} from "@/features/voice/services/voice-vorgaenge-store";

const POLL_INTERVAL_MS = 15_000;
const INITIAL_DELAY_MS = 3_000;

async function syncPendingVoiceIntakes(): Promise<void> {
  const intakes = await fetchPendingVoiceIntakes();
  if (intakes.length === 0) return;

  const existingIds = new Set(getVoiceVorgaenge().map((item) => item.id));
  const ackIds: string[] = [];

  for (const intake of intakes) {
    const { processed, callId } = intake;
    if (!processed?.vorgangId) continue;

    const alreadyIngested = existingIds.has(processed.vorgangId);
    if (!alreadyIngested) {
      ingestVoiceProcessedCall(processed);
      notifyVoiceIntake(processed);
      existingIds.add(processed.vorgangId);
    }

    ackIds.push(callId);
  }

  if (ackIds.length > 0) {
    await ackVoiceIntakes(ackIds);
  }
}

export function VoiceIntakeSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const runningRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const initialTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const run = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        await syncPendingVoiceIntakes();
      } catch (error) {
        console.error("[voice intake sync]", error);
      } finally {
        runningRef.current = false;
      }
    };

    initialTimeoutRef.current = window.setTimeout(() => {
      void run();
      intervalRef.current = window.setInterval(() => {
        void run();
      }, POLL_INTERVAL_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      if (initialTimeoutRef.current != null) {
        window.clearTimeout(initialTimeoutRef.current);
      }
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return children;
}
