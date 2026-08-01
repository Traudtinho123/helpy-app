"use client";

import { Loader2 } from "lucide-react";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { HelpyChatMessage } from "@/features/helpy-chat/types/helpy-chat-types";
import { cn } from "@/lib/utils";

type HelpyChatThreadProps = {
  messages: HelpyChatMessage[];
  isSending?: boolean;
  error?: string | null;
  className?: string;
};

export function HelpyChatThread({
  messages,
  isSending = false,
  error = null,
  className,
}: HelpyChatThreadProps) {
  if (messages.length === 0 && !isSending && !error) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message) =>
        message.role === "user" ? (
          <div key={message.id} className="flex justify-end">
            <div className="max-w-[88%] rounded-[18px] rounded-tr-[6px] bg-[#2563EB] px-4 py-3 text-[13px] leading-[1.6] text-white shadow-sm">
              {message.content}
            </div>
          </div>
        ) : (
          <div key={message.id} className="helpy-fade-in-slide flex gap-3">
            <HelpyAvatar size="sm" pose="typing" />
            <div className="min-w-0 flex-1">
              <p className="helpy-label mb-2 normal-case tracking-normal">
                HELPY
              </p>
              <div className="helpy-chat-bubble rounded-[20px] rounded-tl-[8px] px-4 py-3.5">
                <p className="text-[13px] leading-[1.65] text-[var(--text-primary)]">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {isSending ? (
        <div className="flex items-center gap-2 px-1 text-[12px] text-[var(--text-muted)]">
          <Loader2 className="size-3.5 animate-spin text-[#6366F1]" />
          HELPY tippt…
        </div>
      ) : null}

      {error ? (
        <p className="rounded-[12px] border border-[#FECACA]/60 bg-[#FEF2F2]/80 px-3 py-2 text-[12px] text-[#B91C1C]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
