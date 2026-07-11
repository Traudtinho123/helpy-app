import { NextResponse } from "next/server";
import { mapOutlookMessagesToUnifiedMail } from "@/features/mail/services/unified-mail-mapper";
import {
  fetchOutlookConversationMessages,
  fetchOutlookInboxMessages,
  fetchOutlookMessages,
  withOutlookMailClient,
} from "@/features/outlook/services/outlook-mail-client";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";

export async function POST(): Promise<NextResponse> {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  try {
    const payload = await withOutlookMailClient(async (tokens) => {
      const fromMe = await fetchOutlookMessages(tokens, 50);
      const inbox = await fetchOutlookInboxMessages(tokens, 50);
      const conversationIds = [
        ...new Set(
          [...fromMe, ...inbox].map((message) => message.conversationId)
        ),
      ];

      const conversationMessages = (
        await Promise.all(
          conversationIds.slice(0, 12).map((conversationId) =>
            fetchOutlookConversationMessages(tokens, conversationId, 20)
          )
        )
      ).flat();

      const merged = new Map<
        string,
        ReturnType<typeof mapOutlookMessagesToUnifiedMail>[number]
      >();
      for (const message of mapOutlookMessagesToUnifiedMail(
        [...fromMe, ...inbox, ...conversationMessages],
        tokens.accountEmail
      )) {
        merged.set(message.id, message);
      }

      return {
        messages: [...merged.values()],
        accountEmail: tokens.accountEmail,
        syncedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Outlook-Sync fehlgeschlagen.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
