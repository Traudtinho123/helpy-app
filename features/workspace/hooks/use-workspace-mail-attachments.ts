"use client";

import { useEffect, useMemo, useState } from "react";
import { dedupeUnifiedMailAttachments } from "@/features/mail/services/mail-attachment-mapper";
import {
  fetchGmailThreadAttachments,
} from "@/features/mail/services/mail-attachments-client";
import type { UnifiedMailAttachment } from "@/features/mail/types/unified-mail-types";
import { getMailListeVorgang } from "@/features/mail/unified-mail-source-service";

/** Gmail-Anhänge für einen Vorgang (Store + optional Thread-Nachladen). */
export function useWorkspaceMailAttachments(vorgangId: string): {
  attachments: readonly UnifiedMailAttachment[];
  loading: boolean;
} {
  const liste = getMailListeVorgang(vorgangId);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<UnifiedMailAttachment[]>(
    liste?.mailAttachments ?? []
  );

  useEffect(() => {
    const connectionId = liste?.mailConnectionId;
    const threadId = liste?.threadId;

    if (!connectionId || !threadId || liste?.mailProvider !== "gmail") {
      setAttachments(liste?.mailAttachments ?? []);
      return;
    }

    setLoading(true);
    void fetchGmailThreadAttachments({ connectionId, threadId })
      .then((loaded) => {
        setAttachments(
          loaded.length > 0 ? loaded : (liste.mailAttachments ?? [])
        );
      })
      .finally(() => setLoading(false));
  }, [
    liste?.mailAttachments,
    liste?.mailConnectionId,
    liste?.mailProvider,
    liste?.threadId,
    vorgangId,
  ]);

  const sorted = useMemo(
    () => dedupeUnifiedMailAttachments(attachments),
    [attachments]
  );

  return { attachments: sorted, loading };
}
