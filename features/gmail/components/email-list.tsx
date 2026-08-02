"use client";

import { Badge } from "@/components/ui/badge";
import type {
  ChipFilter,
  Email,
  EmailPriority,
  EmailSmartBadge,
} from "@/features/gmail/mock/mock-emails";
import { cn } from "@/lib/utils";
import { InboxActionBar } from "@/features/gmail/components/inbox-action-bar";
import { InboxFilterChips } from "@/features/gmail/components/inbox-filter-chips";

type EmailListProps = {
  emails: Email[];
  selectedId: string;
  onSelect: (id: string) => void;
  activeChip: ChipFilter;
  onChipChange: (chip: ChipFilter) => void;
  chipCounts: Record<ChipFilter, number>;
};

const priorityStyles: Record<
  EmailPriority,
  { dot: string; label: string }
> = {
  hoch: { dot: "bg-[#EF4444]", label: "Hoch" },
  mittel: { dot: "bg-[#F59E0B]", label: "Mittel" },
  niedrig: { dot: "bg-[#94A3B8]", label: "Niedrig" },
};

const smartBadgeStyles: Record<
  EmailSmartBadge,
  { label: string; className: string }
> = {
  dringend: {
    label: "Dringend",
    className: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  },
  angebot: {
    label: "Angebot",
    className: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  },
  rechnung: {
    label: "Rechnung",
    className: "border-[#E9D5FF] bg-[#FAF5FF] text-[#7C3AED]",
  },
  termin: {
    label: "Termin",
    className: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  },
  "antwort-empfohlen": {
    label: "Antwort empfohlen",
    className: "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--accent)]",
  },
  "antwort-fertig": {
    label: "Antwort fertig",
    className: "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
  },
};

function EmailSmartBadges({ badges }: { badges: EmailSmartBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {badges.map((badge) => {
        const style = smartBadgeStyles[badge];
        return (
          <Badge
            key={badge}
            variant="outline"
            className={cn(
              "h-5 rounded-full px-2 text-[10px] font-semibold",
              style.className
            )}
          >
            {style.label}
          </Badge>
        );
      })}
    </div>
  );
}

function EmailListItem({
  email,
  isSelected,
  onSelect,
}: {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const priority = priorityStyles[email.priority];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full gap-4 border-b border-[var(--border)] px-6 py-4 text-left transition-all duration-300",
        isSelected
          ? "bg-[var(--bg-surface)] shadow-[inset_3px_0_0_#2563EB]"
          : "hover:bg-[var(--bg-surface)]",
        email.unread && !isSelected && "bg-[var(--accent-light)]/50"
      )}
    >
      <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
        <span
          className={cn("size-2 rounded-full", priority.dot)}
          title={`Priorität: ${priority.label}`}
        />
        {email.unread && (
          <span className="size-2 rounded-full bg-[#2563EB]" title="Ungelesen" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-[13px] tracking-[-0.01em]",
                email.unread
                  ? "font-semibold text-[var(--text-primary)]"
                  : "font-medium text-[var(--text-secondary)]"
              )}
            >
              {email.sender}
            </p>
            <p className="truncate text-[11px] text-[var(--text-secondary)]">{email.company}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {email.time}
            </span>
            {email.unread && (
              <Badge className="h-4 rounded-full border-0 bg-[#2563EB] px-1.5 text-[9px] font-semibold text-white">
                Neu
              </Badge>
            )}
          </div>
        </div>

        <p
          className={cn(
            "mt-1.5 truncate text-[13px] tracking-[-0.01em]",
            email.unread ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]"
          )}
        >
          {email.subject}
        </p>
        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {email.preview}
        </p>

        <EmailSmartBadges badges={email.badges} />
      </div>
    </button>
  );
}

export function EmailList({
  emails,
  selectedId,
  onSelect,
  activeChip,
  onChipChange,
  chipCounts,
}: EmailListProps) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[var(--bg-surface)] backdrop-blur-sm">
      <InboxActionBar />
      <InboxFilterChips
        activeChip={activeChip}
        onChipChange={onChipChange}
        counts={chipCounts}
      />

      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            E-Mails
          </h2>
          <p className="text-[11px] font-medium text-[var(--text-secondary)]">
            {emails.length} {emails.length === 1 ? "Nachricht" : "Nachrichten"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <p className="text-sm text-[var(--text-secondary)]">
              Keine E-Mails in diesem Filter.
            </p>
          </div>
        ) : (
          emails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={email.id === selectedId}
              onSelect={() => onSelect(email.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
