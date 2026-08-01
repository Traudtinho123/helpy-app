import { describe, expect, it } from "vitest";
import { resolveVorgangRouteAddress, resolveVorgangPhone } from "@/features/brain/services/helpy-actions/action-context";
import { resolveActionKind } from "@/features/brain/services/helpy-actions/action-kinds";
import { resolveHelpyActionExecution } from "@/features/brain/services/helpy-actions/resolve-action-execution";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

function createVorgang(overrides: Partial<Vorgang> = {}): Vorgang {
  return {
    id: "vorgang-test",
    skill: "real-estate",
    kunde: {
      firmenname: "Muster AG",
      ansprechpartner: "Anna Beispiel",
      email: "anna@muster.ch",
      telefon: "",
      adresse: "",
      status: "Neu",
    },
    aufgabe: {
      titel: "Besichtigung anfragen",
      kategorie: "E-Mail",
      fortschritt: 10,
      empfohleneAktion: "Termin vorschlagen",
    },
    letzteEmail: {
      betreff: "Besichtigung",
      absender: "anna@muster.ch",
      datum: "Heute",
      inhalt: "Ich möchte die Wohnung besichtigen.",
      zusammenfassung: "Besichtigungswunsch",
    },
    termine: [],
    dokumente: [],
    notizen: "",
    helpy: {
      empfehlung: "Besichtigung planen",
      naechsterSchritt: "Termin vorschlagen",
    },
    ...overrides,
  };
}

describe("helpy action execution", () => {
  it("maps besichtigung actions to route and disables without address", () => {
    const action = resolveHelpyActionExecution(
      {
        id: "re-besichtigung-planen",
        icon: "📅",
        title: "Besichtigung planen",
        description: "Termin abstimmen",
        benefit: "Spart Zeit",
        primaryLabel: "Termin vorschlagen",
        priority: 1,
      },
      createVorgang()
    );

    expect(action.executionKind).toBe("route");
    expect(action.disabled).toBe(true);
    expect(action.disabledReason).toBe("Kein Objekt verknüpft");
  });

  it("enables route when customer address exists", () => {
    const vorgang = createVorgang({
      kunde: {
        ...createVorgang().kunde,
        adresse: "Bahnhofstrasse 1, 8001 Zürich",
      },
    });

    expect(resolveVorgangRouteAddress(vorgang)).toBe("Bahnhofstrasse 1, 8001 Zürich");
  });

  it("disables call actions without phone number", () => {
    const action = resolveHelpyActionExecution(
      {
        id: "hw-kunde-anrufen",
        icon: "☎",
        title: "Kunde anrufen",
        description: "Kurz anrufen",
        benefit: "Schnell",
        primaryLabel: "Anruf vorbereiten",
        priority: 1,
      },
      createVorgang()
    );

    expect(resolveActionKind(action)).toBe("call");
    expect(action.disabled).toBe(true);
    expect(action.disabledReason).toBe("Keine Telefonnummer in Kundenakte");
    expect(resolveVorgangPhone(vorgangWithPhone())).toBe("+41 79 000 00 00");
  });
});

function vorgangWithPhone(): Vorgang {
  return createVorgang({
    kunde: {
      ...createVorgang().kunde,
      telefon: "+41 79 000 00 00",
    },
  });
}
