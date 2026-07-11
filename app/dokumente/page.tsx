import { Suspense } from "react";
import { DokumentePage } from "@/features/documents/components/dokumente-page";

export default function DokumenteRoute() {
  return (
    <Suspense fallback={null}>
      <DokumentePage />
    </Suspense>
  );
}
