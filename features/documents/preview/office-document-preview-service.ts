import {
  isExcelMimeType,
  resolveAttachmentContentType,
} from "@/features/gmail/services/gmail/attachment-parser";
import type { WorkSheet } from "xlsx";

const MAX_EXCEL_ROWS = 100;
const MAX_EXCEL_COLS = 30;

export type OfficePreviewResult =
  | { status: "ready"; html: string; note?: string }
  | { status: "unsupported"; message: string }
  | { status: "error"; message: string };

export type OfficePreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; html: string; note?: string }
  | { status: "unsupported"; message: string }
  | { status: "error"; message: string };

function fileExtension(fileName: string): string {
  const match = fileName.trim().toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function getOfficePreviewUnsupportedMessage(fileName: string): string {
  const ext = fileExtension(fileName);
  if (ext === "doc") {
    return "Ältere .doc-Dateien können nicht als Vorschau angezeigt werden. Bitte herunterladen und in Word öffnen.";
  }
  if (ext === "ppt" || ext === "pptx") {
    return "PowerPoint-Vorschau ist nicht verfügbar. Bitte die Datei herunterladen.";
  }
  return "Für diesen Dateityp ist keine Vorschau verfügbar. Bitte herunterladen.";
}

export function canPreviewOfficeAttachment(
  fileName: string,
  mimeType: string
): boolean {
  const ext = fileExtension(fileName);

  if (ext === "docx") return true;
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return true;
  if (ext === "doc" || ext === "ppt" || ext === "pptx") return false;

  const resolved = resolveAttachmentContentType(fileName, mimeType);
  if (resolved === "application/msword") return false;
  if (resolved.includes("wordprocessingml")) return true;
  if (isExcelMimeType(resolved)) return true;

  return /\.(docx|xlsx?|csv)$/i.test(fileName);
}

export function isWordPreviewAttachment(
  fileName: string,
  mimeType: string
): boolean {
  const ext = fileExtension(fileName);
  if (ext === "doc") return false;
  if (ext === "docx") return true;

  const resolved = resolveAttachmentContentType(fileName, mimeType);
  return resolved.includes("wordprocessingml");
}

export function isExcelPreviewAttachment(
  fileName: string,
  mimeType: string
): boolean {
  const ext = fileExtension(fileName);
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return true;
  return isExcelMimeType(resolveAttachmentContentType(fileName, mimeType));
}

function truncateExcelSheet(
  sheet: WorkSheet,
  maxRows: number,
  maxCols: number,
  utils: typeof import("xlsx").utils
): { sheet: WorkSheet; truncated: boolean } {
  if (!sheet["!ref"]) return { sheet, truncated: false };

  const range = utils.decode_range(sheet["!ref"]);
  const rowCount = range.e.r - range.s.r + 1;
  const colCount = range.e.c - range.s.c + 1;
  const truncated = rowCount > maxRows || colCount > maxCols;

  if (!truncated) return { sheet, truncated: false };

  const nextRange = {
    s: range.s,
    e: {
      r: Math.min(range.e.r, range.s.r + maxRows - 1),
      c: Math.min(range.e.c, range.s.c + maxCols - 1),
    },
  };

  const nextSheet: WorkSheet = { ...sheet };
  for (const key of Object.keys(nextSheet)) {
    if (key.startsWith("!")) continue;
    const cell = utils.decode_cell(key);
    if (
      cell.r > nextRange.e.r ||
      cell.c > nextRange.e.c ||
      cell.r < nextRange.s.r ||
      cell.c < nextRange.s.c
    ) {
      delete nextSheet[key];
    }
  }
  nextSheet["!ref"] = utils.encode_range(nextRange);

  return { sheet: nextSheet, truncated: true };
}

export async function renderWordPreviewFromApi(
  openUrl: string
): Promise<OfficePreviewResult> {
  const params = openUrl.includes("?")
    ? openUrl.split("?")[1]
    : new URL(openUrl, "http://localhost").searchParams.toString();

  const response = await fetch(
    `/api/mail/attachments/preview/word?${params}`,
    { cache: "no-store" }
  );

  const payload = (await response.json()) as OfficePreviewResult & {
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    if (payload.status === "unsupported" || payload.status === "error") {
      return payload;
    }
    return {
      status: "error",
      message: payload.error ?? payload.message ?? "Word-Vorschau fehlgeschlagen.",
    };
  }

  return payload;
}

async function renderExcelPreview(
  buffer: ArrayBuffer,
  fileName: string
): Promise<OfficePreviewResult> {
  const XLSX = await import("xlsx");
  const ext = fileExtension(fileName);

  const workbook =
    ext === "csv"
      ? XLSX.read(new TextDecoder("utf-8").decode(buffer), {
          type: "string",
          raw: false,
        })
      : XLSX.read(buffer, { type: "array", raw: false });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      status: "unsupported",
      message: "Die Tabelle enthält keine Blätter.",
    };
  }

  const originalSheet = workbook.Sheets[sheetName];
  const { sheet, truncated } = truncateExcelSheet(
    originalSheet,
    MAX_EXCEL_ROWS,
    MAX_EXCEL_COLS,
    XLSX.utils
  );

  const html = XLSX.utils.sheet_to_html(sheet, {
    id: "helpy-office-preview-table",
  });
  const sheetLabel = `Blatt „${sheetName}"`;

  return {
    status: "ready",
    html,
    note: truncated
      ? `${sheetLabel} — Vorschau auf ${MAX_EXCEL_ROWS} Zeilen und ${MAX_EXCEL_COLS} Spalten gekürzt.`
      : workbook.SheetNames.length > 1
        ? `${sheetLabel} (weitere Blätter nur per Download)`
        : sheetLabel,
  };
}

export async function renderOfficeDocumentPreview(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string
): Promise<OfficePreviewResult> {
  if (!canPreviewOfficeAttachment(fileName, mimeType)) {
    return {
      status: "unsupported",
      message: getOfficePreviewUnsupportedMessage(fileName),
    };
  }

  try {
    if (isExcelPreviewAttachment(fileName, mimeType)) {
      return await renderExcelPreview(buffer, fileName);
    }

    return {
      status: "unsupported",
      message: getOfficePreviewUnsupportedMessage(fileName),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Vorschau konnte nicht erstellt werden.",
    };
  }
}
