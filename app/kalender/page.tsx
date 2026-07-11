import { Suspense } from "react";
import { KalenderPage } from "@/features/calendar/components/kalender-page";

export default function KalenderRoute() {
  return (
    <Suspense fallback={null}>
      <KalenderPage />
    </Suspense>
  );
}
