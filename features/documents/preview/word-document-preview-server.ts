import mammoth from "mammoth";

export type WordPreviewPayload =
  | { status: "ready"; html: string; note?: string }
  | { status: "unsupported"; message: string }
  | { status: "error"; message: string };

export async function convertWordBufferToPreview(
  buffer: Buffer
): Promise<WordPreviewPayload> {
  try {
    const result = await mammoth.convertToHtml({ buffer });

    if (!result.value.trim()) {
      return {
        status: "unsupported",
        message: "Word-Datei enthält keinen darstellbaren Inhalt.",
      };
    }

    return {
      status: "ready",
      html: result.value,
      note:
        result.messages.length > 0
          ? "Vorschau kann vom Original abweichen."
          : undefined,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Word-Vorschau konnte nicht erstellt werden.",
    };
  }
}
