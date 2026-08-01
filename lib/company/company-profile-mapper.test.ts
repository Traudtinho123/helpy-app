import { describe, expect, it } from "vitest";
import {
  companyProfileToRowPatch,
  companyRowToProfile,
} from "@/lib/company/company-profile-mapper";

describe("company profile mapper", () => {
  it("maps database row to company profile", () => {
    const profile = companyRowToProfile({
      id: "company-1",
      name: "Traudt Immobilien GmbH",
      industry: "Immobilien",
      phone: "+41 44 000 00 00",
      website: "www.example.ch",
      email: "info@example.ch",
      address: "Bahnhofstrasse 1",
      city: "Zürich",
      zip: "8001",
      iban: "CH93 0076 2011 6238 5295 7",
      mwst_nummer: "CHE-123.456.789 MWST",
      logo_url: "https://cdn.example/logo.png",
      profile_settings: {
        logoInitials: "TI",
        defaultVatRate: 8.1,
        documentLanguage: "de",
        companySignature: "Freundliche Grüsse\nTraudt Immobilien",
      },
    });

    expect(profile.companyName).toBe("Traudt Immobilien GmbH");
    expect(profile.phone).toBe("+41 44 000 00 00");
    expect(profile.address).toBe("Bahnhofstrasse 1, 8001 Zürich");
    expect(profile.taxId).toBe("CHE-123.456.789 MWST");
    expect(profile.logoUrl).toBe("https://cdn.example/logo.png");
  });

  it("splits combined address into row columns on save", () => {
    const patch = companyProfileToRowPatch(
      companyRowToProfile({
        id: "company-1",
        name: "Demo AG",
        industry: null,
        phone: null,
        website: null,
        email: null,
        address: "Seestrasse 10",
        city: "Zug",
        zip: "6300",
        iban: null,
        mwst_nummer: null,
        logo_url: null,
        profile_settings: {},
      })
    );

    expect(patch.address).toBe("Seestrasse 10");
    expect(patch.zip).toBe("6300");
    expect(patch.city).toBe("Zug");
  });
});
