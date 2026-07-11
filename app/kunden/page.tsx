import { Suspense } from "react";
import { KundenPage } from "@/features/customers/components/kunden-page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <KundenPage />
    </Suspense>
  );
}
