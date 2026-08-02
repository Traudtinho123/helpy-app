import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center",
        className
      )}
    >
      {icon ?? <Avatar size="md" />}
      <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
      {description && (
        <p className="max-w-xs text-[12px] leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export { EmptyState };
