"use client";

import { useEffect, useState } from "react";
import {
  canPreviewOfficeAttachment,
  getOfficePreviewUnsupportedMessage,
  isWordPreviewAttachment,
  renderOfficeDocumentPreview,
  renderWordPreviewFromApi,
  type OfficePreviewState,
} from "@/features/documents/preview/office-document-preview-service";

export function useOfficeDocumentPreview(
  openUrl: string,
  fileName: string,
  mimeType: string,
  enabled: boolean
): OfficePreviewState {
  const [state, setState] = useState<OfficePreviewState>(() =>
    enabled ? { status: "loading" } : { status: "idle" }
  );

  useEffect(() => {
    if (!enabled) {
      setState({ status: "idle" });
      return;
    }

    if (!canPreviewOfficeAttachment(fileName, mimeType)) {
      setState({
        status: "unsupported",
        message: getOfficePreviewUnsupportedMessage(fileName),
      });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    const loadPreview = async (): Promise<OfficePreviewState> => {
      if (isWordPreviewAttachment(fileName, mimeType)) {
        return renderWordPreviewFromApi(openUrl);
      }

      const response = await fetch(openUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Datei konnte nicht geladen werden.");
      }

      const buffer = await response.arrayBuffer();
      return renderOfficeDocumentPreview(buffer, fileName, mimeType);
    };

    void loadPreview()
      .then((result) => {
        if (cancelled) return;
        setState(result);
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Vorschau konnte nicht geladen werden.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, fileName, mimeType, openUrl]);

  return state;
}
