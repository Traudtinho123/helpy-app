"use client";

import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import { pushDealNotification } from "@/features/deals/services/deal-client-store";

export async function syncDealPhaseFromVorgangMail(input: {
  vorgangId: string;
  mailContent: string;
  interessentName?: string;
}): Promise<boolean> {
  try {
    const response = await fetch("/api/deals/detect-phase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as {
      updated?: boolean;
      notification?: string;
    };

    if (data.updated && data.notification) {
      pushDealNotification(data.notification);
    }

    return Boolean(data.updated);
  } catch {
    return false;
  }
}

export async function syncDealPhasesFromGmailBundles(
  bundles: GmailVorgangBundle[]
): Promise<void> {
  await Promise.all(
    bundles.map(async (bundle) => {
      const mailContent = [
        bundle.message.subject,
        bundle.message.snippet,
        bundle.brain?.summary,
      ]
        .filter(Boolean)
        .join("\n");

      if (!mailContent.trim()) return;

      await syncDealPhaseFromVorgangMail({
        vorgangId: bundle.liste.id,
        mailContent,
        interessentName:
          bundle.liste.kunde ?? bundle.liste.from ?? bundle.message.from,
      });
    })
  );
}
