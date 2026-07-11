import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  canPreviewOfficeAttachment,
  renderOfficeDocumentPreview,
} from "@/features/documents/preview/office-document-preview-service";

describe("office document preview", () => {
  it("erlaubt Vorschau für docx, xlsx und csv", () => {
    expect(
      canPreviewOfficeAttachment(
        "Vertrag.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe(true);
    expect(
      canPreviewOfficeAttachment(
        "Kalkulation.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
    ).toBe(true);
    expect(canPreviewOfficeAttachment("Liste.csv", "text/csv")).toBe(true);
  });

  it("erlaubt docx auch bei generischem Gmail-MIME", () => {
    expect(
      canPreviewOfficeAttachment("Vertrag.docx", "application/octet-stream")
    ).toBe(true);
    expect(
      canPreviewOfficeAttachment(
        "Vertrag.docx",
        "application/msword"
      )
    ).toBe(true);
  });

  it("blockiert ältere .doc-Dateien", () => {
    expect(
      canPreviewOfficeAttachment("Brief.doc", "application/msword")
    ).toBe(false);
  });

  it("rendert Excel als HTML-Tabelle", async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Objekt", "Preis"],
      ["Wohnung A", "850000"],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Daten");
    const data = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    }) as number[];
    const buffer = new Uint8Array(data).buffer;

    const result = await renderOfficeDocumentPreview(
      buffer,
      "Kalkulation.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.html).toContain("Wohnung A");
      expect(result.html).toContain("850000");
    }
  });

  it("rendert CSV als HTML-Tabelle", async () => {
    const csv = "Name;Status\nMüller;aktiv\n";
    const buffer = new TextEncoder().encode(csv).buffer;

    const result = await renderOfficeDocumentPreview(
      buffer,
      "Liste.csv",
      "text/csv"
    );

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.html).toContain("Müller");
      expect(result.html).toContain("aktiv");
    }
  });
});
