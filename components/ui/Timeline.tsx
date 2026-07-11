import { cn } from "@/lib/utils";

export type TimelineEntry = {
  id: string;
  time: string;
  label: string;
  description?: string;
};

type TimelineProps = {
  entries: TimelineEntry[];
  maxVisible?: number;
  className?: string;
};

function Timeline({ entries, maxVisible, className }: TimelineProps) {
  const visible = maxVisible ? entries.slice(-maxVisible) : entries;

  return (
    <ol className={cn("relative space-y-0", className)}>
      {visible.map((entry, index) => (
        <li
          key={entry.id}
          className="relative flex gap-4 pb-5 last:pb-0"
        >
          {index < visible.length - 1 && (
            <span className="absolute left-[3.35rem] top-6 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-[#BFDBFE] to-transparent" />
          )}
          <time className="w-12 shrink-0 pt-0.5 text-[11px] font-medium tabular-nums text-[#94A3B8]">
            {entry.time}
          </time>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-[#0F172A]">{entry.label}</p>
            {entry.description && (
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748B]">
                {entry.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export { Timeline };
