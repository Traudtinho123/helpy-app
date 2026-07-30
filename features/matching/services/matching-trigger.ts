import type { RealEstateObject } from "@/features/real-estate/object/object-types";

/** Triggert Matching nach Objekt-Speicherung (Gmail-Erkennung, manuelle Anlage). */
export function triggerObjectMatching(object: RealEstateObject): void {
  if (typeof window === "undefined") return;

  void import("@/features/matching/services/match-client-store").then(
    (store) => {
      void import("@/features/kundenakte/services/kundenakte-store").then(
        ({ getAllKundenakten }) => {
          if (!store.getSuchprofileSnapshot().length) return;

          const kundeNames = new Map(
            getAllKundenakten().map((kunde) => [
              kunde.id,
              { name: kunde.name, email: kunde.email, telefon: kunde.telefon },
            ])
          );

          store.runMatchingForObject(object, kundeNames);
        }
      );
    }
  );
}
