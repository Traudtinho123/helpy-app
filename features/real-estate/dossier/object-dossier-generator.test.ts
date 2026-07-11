/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateObjectDossier } from "@/features/real-estate/dossier/object-dossier-generator";
import { clearObjectDossierStoreForTests } from "@/features/real-estate/dossier/object-dossier-store";
import {
  clearRealEstateObjectStore,
  upsertRealEstateObject,
} from "@/features/real-estate/object/object-memory";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import {
  loadCompanyProfileById,
  updateLoadedCompanyProfile,
} from "@/lib/company/company-profile-service";
import { MOCK_COMPANY_PROFILE } from "@/lib/company/company-profile-types";

function buildTestObject(overrides: Partial<RealEstateObject> = {}): RealEstateObject {
  const now = "2026-07-11T10:00:00.000Z";
  return {
    objectId: "obj-dossier-test",
    quelle: "Website Anfrage",
    adresse: "Seestrasse 12",
    plz: "8002",
    ort: "Zürich",
    land: "Schweiz",
    titel: "Helle 4.5-Zimmer-Wohnung am See",
    beschreibung: "Grosszügiger Balkon mit Seesicht.",
    transaktion: "Miete",
    preis: "CHF 3'200",
    zimmer: "4.5",
    wohnflaeche: "110 m²",
    stockwerk: "3",
    baujahr: "2018",
    verfuegbarkeit: "01.08.2026",
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

describe("object dossier generator", () => {
  beforeEach(() => {
    loadCompanyProfileById(MOCK_COMPANY_PROFILE.companyId);
    updateLoadedCompanyProfile({
      companyName: "Traudt Immobilien GmbH",
      documentLanguage: "de",
    });
    upsertRealEstateObject(buildTestObject());
  });

  afterEach(() => {
    clearRealEstateObjectStore();
    clearObjectDossierStoreForTests();
  });

  it("erzeugt ein Dossier mit Objektdaten und KI-Beschreibung", () => {
    const dossier = generateObjectDossier("obj-dossier-test");

    expect(dossier).not.toBeNull();
    expect(dossier?.status).toBe("draft");
    expect(dossier?.titel).toBe("Helle 4.5-Zimmer-Wohnung am See");
    expect(dossier?.adresse).toBe("Seestrasse 12");
    expect(dossier?.ort).toBe("Zürich");
    expect(dossier?.objectType).toBe("Wohnung");
    expect(dossier?.preisLabel).toContain("3");
    expect(dossier?.description).toContain("Seestrasse 12");
    expect(dossier?.description).toContain("Zürich");
    expect(dossier?.description).toContain("Grosszügiger Balkon mit Seesicht.");
    expect(dossier?.descriptionAiGenerated).toBe(true);
    expect(dossier?.highlights.length).toBeGreaterThanOrEqual(4);
    expect(dossier?.highlights.some((item) => item.includes("110 m²"))).toBe(true);
    expect(dossier?.highlights.some((item) => item.includes("4.5"))).toBe(true);
    expect(dossier?.nextStepActions).toContain("Besichtigung anfragen");
    expect(dossier?.contactBlock).toContain("Traudt Immobilien GmbH");
  });

  it("erkennt Gewerbeobjekte am Titel", () => {
    upsertRealEstateObject(
      buildTestObject({
        objectId: "obj-gewerbe",
        titel: "Moderne Gewerbefläche im Zentrum",
        beschreibung: "Offene Bürofläche mit Lift.",
      })
    );

    const dossier = generateObjectDossier("obj-gewerbe");

    expect(dossier?.objectType).toBe("Gewerbe");
    expect(dossier?.description).toContain("gewerbe");
  });
});
