import { describe, expect, it } from "vitest";
import { computeMatchScore, parsePriceChf, parseZimmer } from "./matching-engine";
import {
  extractSuchprofilFromText,
  isSuchprofilExtractionConfident,
} from "./suchprofil-extractor";
import type { SuchprofilRecord } from "@/features/matching/types/matching-types";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";

function buildProfil(overrides: Partial<SuchprofilRecord> = {}): SuchprofilRecord {
  return {
    id: "profil-1",
    company_id: "company-1",
    kunde_id: "kunde-1",
    art: "kaufen",
    objekttyp: ["Wohnung"],
    zimmer_min: 4,
    zimmer_max: 5,
    flaeche_min: null,
    flaeche_max: null,
    preis_max: 800_000,
    lagen: ["Zürich", "Winterthur"],
    muss_kriterien: ["Balkon/Terrasse"],
    notizen: null,
    aktiv: true,
    auto_erkannt: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function buildObject(overrides: Partial<RealEstateObject> = {}): RealEstateObject {
  return {
    objectId: "obj-1",
    quelle: "Website Anfrage",
    adresse: "Seestrasse 12",
    plz: "8001",
    ort: "Zürich",
    land: "Schweiz",
    titel: "4.5-Zimmer-Wohnung mit Balkon",
    beschreibung: "Helle Wohnung mit Balkon und Lift",
    transaktion: "Kauf",
    preis: "750'000 CHF",
    zimmer: "4.5",
    wohnflaeche: "110",
    stockwerk: "3",
    objektLink: null,
    status: "aktiv",
    aktiv: true,
    interessentLinks: [],
    vorgangIds: [],
    besichtigungIds: [],
    dokumentIds: [],
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("suchprofil-extractor", () => {
  it("extrahiert Zimmer, Lage und Budget aus Deutsch-Text", () => {
    const result = extractSuchprofilFromText(
      "Wir suchen eine 4-5 Zimmer Wohnung in Zürich oder Winterthur, Budget bis CHF 800'000"
    );

    expect(result.zimmer_min).toBe(4);
    expect(result.zimmer_max).toBe(5);
    expect(result.preis_max).toBe(800_000);
    expect(result.lagen.some((l) => l.toLowerCase().includes("zürich"))).toBe(true);
    expect(isSuchprofilExtractionConfident(result)).toBe(true);
  });
});

describe("matching-engine", () => {
  it("parst Schweizer Preis und Zimmer", () => {
    expect(parsePriceChf("750'000 CHF")).toBe(750_000);
    expect(parseZimmer("4.5")).toBe(4.5);
  });

  it("erreicht >= 70% bei passendem Objekt", () => {
    const { score } = computeMatchScore(buildProfil(), buildObject());
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it("gibt 0% bei falscher Transaktionsart", () => {
    const { score } = computeMatchScore(
      buildProfil({ art: "mieten" }),
      buildObject({ transaktion: "Kauf" })
    );
    expect(score).toBe(0);
  });
});
