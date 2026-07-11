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
        "flex flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/80 p-8 text-center",
        className
      )}
    >
      {icon ?? <Avatar size="md" />}
      <p className="text-sm font-medium text-[#64748B]">{title}</p>
      {description && (
        <p className="max-w-xs text-[12px] leading-relaxed text-[#94A3B8]">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export { EmptyState };
