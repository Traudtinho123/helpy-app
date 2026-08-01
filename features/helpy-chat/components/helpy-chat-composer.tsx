"use client";

import { useState, type KeyboardEvent } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HelpyChatComposerProps = {
  onSend: (message: string) => void | Promise<void>;
  isSending?: boolean;
  suggestions?: string[];
  placeholder?: string;
  variant?: "glass" | "footer";
  showHint?: boolean;
  className?: string;
};

export function HelpyChatComposer({
  onSend,
  isSending = false,
  suggestions = [],
  placeholder = "Frag HELPY…",
  variant = "glass",
  showHint = true,
  className,
}: HelpyChatComposerProps) {
  const [draft, setDraft] = useState("");

  const submit = async () => {
    const message = draft.trim();
    if (!message || isSending) return;
    setDraft("");
    await onSend(message);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const containerClass =
    variant === "glass"
      ? "helpy-glass-card rounded-[20px] p-2.5 transition-all duration-200 focus-within:shadow-[var(--button-primary-shadow)]"
      : "rounded-[20px] border border-[#CBD5E1]/50 bg-white p-2.5 shadow-sm";

  return (
    <div className={cn("space-y-3", className)}>
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-0.5">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSending}
              onClick={() => void onSend(suggestion)}
              className="h-8 rounded-full px-3.5 text-[11px] font-medium"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      ) : null}

      <div className={containerClass}>
        <textarea
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSending}
          className="w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none disabled:opacity-60"
        />
        <div
          className={cn(
            "flex items-center px-2 pb-1",
            showHint ? "justify-between" : "justify-end"
          )}
        >
          {showHint ? (
            <p className="text-[10px] font-medium text-[var(--text-muted)]">
              Enter zum Senden · Shift+Enter für neue Zeile
            </p>
          ) : null}
          <Button
            type="button"
            size="icon-sm"
            variant={variant === "glass" ? "primary" : undefined}
            disabled={isSending || !draft.trim()}
            onClick={() => void submit()}
            className={cn(
              "size-8 rounded-[8px]",
              variant === "footer" &&
                "bg-[#2563EB] shadow-[0_4px_12px_rgba(37,99,235,0.35)]"
            )}
            aria-label="Nachricht senden"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" strokeWidth={2.5} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
