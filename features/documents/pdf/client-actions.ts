"use client";

import type { ProfessionalDocumentPayload } from "@/features/documents/pdf/types";
import type { CompanyProfile } from "@/lib/company/company-profile-types";

async function requestPdfBlob(input: {
  payload: ProfessionalDocumentPayload;
  branding: CompanyProfile;
  fileName?: string;
}): Promise<{ blob: Blob; fileName: string }> {
  const response = await fetch("/api/documents/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payload: input.payload,
      branding: input.branding,
      fileName: input.fileName,
    }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(
      detail?.error ?? "PDF konnte nicht erzeugt werden."
    );
  }

  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="([^"]+)"/);
  const fileName = match?.[1] ?? input.fileName ?? "dokument.pdf";
  const blob = await response.blob();
  return { blob, fileName };
}

export async function downloadProfessionalPdf(input: {
  payload: ProfessionalDocumentPayload;
  branding: CompanyProfile;
  fileName?: string;
}): Promise<void> {
  const { blob, fileName } = await requestPdfBlob(input);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function printProfessionalPdf(input: {
  payload: ProfessionalDocumentPayload;
  branding: CompanyProfile;
  fileName?: string;
}): Promise<void> {
  const { blob } = await requestPdfBlob(input);
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error("Pop-up blockiert — bitte Pop-ups erlauben und erneut versuchen.");
  }

  const revoke = () => URL.revokeObjectURL(url);
  printWindow.addEventListener("load", () => {
    try {
      printWindow.focus();
      printWindow.print();
    } finally {
      window.setTimeout(revoke, 60_000);
    }
  });
}

export async function fetchProfessionalPdfBase64(input: {
  payload: ProfessionalDocumentPayload;
  branding: CompanyProfile;
  fileName?: string;
}): Promise<{ base64: string; fileName: string; mimeType: string }> {
  const { blob, fileName } = await requestPdfBlob(input);
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return {
    base64: btoa(binary),
    fileName,
    mimeType: "application/pdf",
  };
}
