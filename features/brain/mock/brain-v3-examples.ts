import type { BrainV3AnalysisInput } from "@/features/brain/types/brain-v3-types";

/** Beispiel-Eingaben für Brain v3 — Entwicklung und Tests. */
export const BRAIN_V3_EXAMPLE_INPUTS: BrainV3AnalysisInput[] = [
  {
    id: "example-re-1",
    threadId: "thread-re-1",
    subject: "Besichtigung Wohnung Weingartenweg 22",
    from: "Anna Keller <anna.keller@example.com>",
    snippet:
      "Guten Tag, ich interessiere mich für die 4.5-Zimmer-Wohnung und möchte gerne am Abend eine Besichtigung.",
    date: "Mon, 7 Jul 2026 18:30:00 +0200",
  },
  {
    id: "example-hw-1",
    threadId: "thread-hw-1",
    subject: "Offertanfrage Badrenovierung",
    from: "Thomas Müller <thomas.mueller@example.com>",
    snippet:
      "Wir planen eine Sanierung unseres Badezimmers und benötigen eine Offerte inklusive Material.",
    date: "Mon, 7 Jul 2026 09:15:00 +0200",
  },
  {
    id: "example-cl-1",
    threadId: "thread-cl-1",
    subject: "Mandatsanfrage Vertragsprüfung",
    from: "FinTech Solutions AG <info@fintech.example>",
    snippet:
      "Wir benötigen eine Beratung zu einem Vertrag und bitten um ein Erstgespräch bis morgen.",
    date: "Mon, 7 Jul 2026 11:00:00 +0200",
  },
  {
    id: "example-spam-1",
    threadId: "thread-spam-1",
    subject: "Summer Sale — 50% Rabatt nur heute",
    from: "Shop Newsletter <newsletter@shop.example>",
    snippet: "Unsubscribe anytime. Promotion bundle inside.",
    date: "Mon, 7 Jul 2026 07:00:00 +0200",
  },
  {
    id: "example-immoscout-1",
    threadId: "thread-immoscout-1",
    subject: "Neue Kontaktanfrage — 4.5-Zi-Wohnung Seefeld",
    from: "ImmoScout24.ch <noreply@immoscout24.ch>",
    snippet:
      "Name: Anna Keller · E-Mail: anna.keller@example.com · Telefon: +41 79 123 45 67 · Objekt: 4.5-Zi-Wohnung Seefeld · Adresse: Seefeldstrasse 12, 8008 Zürich · Besichtigung: Samstag 14:00 · Nachricht: Ich interessiere mich für eine Besichtigung am Wochenende.",
    date: "Mon, 7 Jul 2026 16:20:00 +0200",
  },
  {
    id: "example-homegate-1",
    threadId: "thread-homegate-1",
    subject: "Neue Kontaktanfrage zu Ihrer Immobilie",
    from: "Homegate <service@homegate.ch>",
    snippet:
      "Interessent: Thomas Müller · E-Mail: thomas.mueller@example.com · Telefon: 044 555 12 34 · Objekt: Maisonette Wollishofen · Link: https://www.homegate.ch/kaufen/123456 · Besichtigung: Donnerstag Abend · Nachricht: Gerne würde ich die Wohnung besichtigen.",
    date: "Mon, 7 Jul 2026 13:45:00 +0200",
  },
];
