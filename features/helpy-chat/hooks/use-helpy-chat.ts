"use client";

import { useCallback, useState } from "react";
import type {
  HelpyChatContext,
  HelpyChatMessage,
} from "@/features/helpy-chat/types/helpy-chat-types";

function createMessageId(): string {
  return `helpy-chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type UseHelpyChatOptions = {
  context?: HelpyChatContext;
};

export function useHelpyChat(options: UseHelpyChatOptions = {}) {
  const [messages, setMessages] = useState<HelpyChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || isSending) return;

      const userMessage: HelpyChatMessage = {
        id: createMessageId(),
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, userMessage]);
      setIsSending(true);
      setError(null);

      try {
        const history = [...messages, userMessage].map((entry) => ({
          role: entry.role,
          content: entry.content,
        }));

        const response = await fetch("/api/helpy/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history: history.slice(-8),
            context: options.context,
          }),
        });

        const payload = (await response.json()) as {
          reply?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Nachricht konnte nicht gesendet werden.");
        }

        const assistantMessage: HelpyChatMessage = {
          id: createMessageId(),
          role: "assistant",
          content: payload.reply?.trim() || "Ich konnte gerade keine Antwort erstellen.",
          createdAt: new Date().toISOString(),
        };

        setMessages((current) => [...current, assistantMessage]);
      } catch (sendError) {
        setError(
          sendError instanceof Error
            ? sendError.message
            : "Nachricht konnte nicht gesendet werden."
        );
      } finally {
        setIsSending(false);
      }
    },
    [isSending, messages, options.context]
  );

  return {
    messages,
    isSending,
    error,
    sendMessage,
  };
}
