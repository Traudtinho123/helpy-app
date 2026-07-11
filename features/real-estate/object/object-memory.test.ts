/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  clearRealEstateObjectStore,
  getRealEstateObjectById,
  simulateRealEstateObjectStoreReloadForTests,
  upsertRealEstateObject,
} from "@/features/real-estate/object/object-memory";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { updatePortfolioObjectTitle } from "@/features/portfolio/services/portfolio-add-service";

function buildTestObject(overrides: Partial<RealEstateObject> = {}): RealEstateObject {
  const now = "2026-07-09T12:00:00.000Z";
  return {
    objectId: "obj-test-persist",
    quelle: "Website Anfrage",
    adresse: "Teststrasse 1",
    plz: "8000",
    ort: "Zürich",
    land: "Schweiz",
    titel: "Originaltitel",
    beschreibung: "",
    transaktion: "Kauf",
    preis: "CHF 500'000",
    zimmer: "3.5",
    wohnflaeche: "90 m²",
    stockwerk: null,
    baujahr: null,
    verfuegbarkeit: null,
    objektLink: null,
    status: "aktiv",
    aktiv: true,
    interessentLinks: [],
    vorgangIds: [],
    besichtigungIds: [],
    dokumentIds: [],
    images: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("real-estate object persistence", () => {
  afterEach(() => {
    clearRealEstateObjectStore();
  });

  it("speichert Titeländerungen in localStorage und überlebt Re-Hydration", () => {
    upsertRealEstateObject(buildTestObject());

    updatePortfolioObjectTitle("obj-test-persist", "Neuer Objekttitel");

    const stored = window.localStorage.getItem("helpy-real-estate-objects-v1");
    expect(stored).toBeTruthy();
    expect(stored).toContain("Neuer Objekttitel");

    simulateRealEstateObjectStoreReloadForTests();

    const reloaded = getRealEstateObjectById("obj-test-persist");
    expect(reloaded?.titel).toBe("Neuer Objekttitel");
  });

  it("migriert legacy sessionStorage-Einträge nach localStorage", () => {
    const legacyObject = buildTestObject({ titel: "Aus Session" });
    window.sessionStorage.setItem(
      "helpy-real-estate-objects-v1",
      JSON.stringify([legacyObject])
    );

    simulateRealEstateObjectStoreReloadForTests();

    expect(getRealEstateObjectById("obj-test-persist")?.titel).toBe("Aus Session");
    expect(window.localStorage.getItem("helpy-real-estate-objects-v1")).toContain(
      "Aus Session"
    );
    expect(window.sessionStorage.getItem("helpy-real-estate-objects-v1")).toBeNull();
  });
});
