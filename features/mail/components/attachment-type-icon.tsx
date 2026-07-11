import { FileImage, FileSpreadsheet, FileText, FileType2, Paperclip } from "lucide-react";
import {
  inferMimeTypeFromFileName,
  isExcelMimeType,
  isPdfMimeType,
  isPreviewableImageMimeType,
  isWordMimeType,
} from "@/features/gmail/services/gmail/attachment-parser";
import { cn } from "@/lib/utils";

type AttachmentTypeIconProps = {
  mimeType?: string | null;
  fileName?: string | null;
  className?: string;
};

function resolveMimeType(mimeType?: string | null, fileName?: string | null): string {
  if (mimeType?.trim()) return mimeType.trim();
  if (fileName?.trim()) return inferMimeTypeFromFileName(fileName);
  return "application/octet-stream";
}

export function AttachmentTypeIcon({
  mimeType,
  fileName,
  className,
}: AttachmentTypeIconProps) {
  const resolved = resolveMimeType(mimeType, fileName);

  if (isPreviewableImageMimeType(resolved)) {
    return <FileImage className={cn("size-4 text-[#2563EB]", className)} />;
  }
  if (isPdfMimeType(resolved)) {
    return <FileText className={cn("size-4 text-[#DC2626]", className)} />;
  }
  if (isExcelMimeType(resolved)) {
    return <FileSpreadsheet className={cn("size-4 text-[#16A34A]", className)} />;
  }
  if (isWordMimeType(resolved)) {
    return <FileType2 className={cn("size-4 text-[#2563EB]", className)} />;
  }

  return <Paperclip className={cn("size-4 text-[#64748B]", className)} />;
}

export function attachmentTypeLabel(mimeType?: string | null, fileName?: string | null): string {
  const resolved = resolveMimeType(mimeType, fileName);
  if (isExcelMimeType(resolved)) return "Excel";
  if (isWordMimeType(resolved)) return "Word";
  if (isPdfMimeType(resolved)) return "PDF";
  if (isPreviewableImageMimeType(resolved)) return "Bild";
  return "Datei";
}
