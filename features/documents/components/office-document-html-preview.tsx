"use client";

import { cn } from "@/lib/utils";

type OfficeDocumentHtmlPreviewProps = {
  html: string;
  note?: string;
  className?: string;
};

export function OfficeDocumentHtmlPreview({
  html,
  note,
  className,
}: OfficeDocumentHtmlPreviewProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {note ? (
        <p className="text-[10px] text-[var(--text-muted)]">{note}</p>
      ) : null}
      <div
        className={cn(
          "max-h-[min(420px,50vh)] overflow-auto rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4",
          "text-[12px] leading-relaxed text-[var(--text-secondary)]",
          "[&_h1]:mt-3 [&_h1]:text-[16px] [&_h1]:font-semibold [&_h2]:mt-2 [&_h2]:text-[14px] [&_h2]:font-semibold",
          "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[11px]",
          "[&_td]:border [&_td]:border-[var(--border)] [&_td]:px-2 [&_td]:py-1 [&_td]:align-top",
          "[&_th]:border [&_th]:border-[var(--border)] [&_th]:bg-[var(--bg-elevated)] [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold"
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
