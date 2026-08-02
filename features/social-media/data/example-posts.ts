import type { SocialPlatform } from "@/features/social-media/types/social-media-types";

export type SocialExamplePost = {
  id: string;
  platform: SocialPlatform;
  title: string;
  textContent: string;
  hashtags: string[];
  hint: string;
  footerHint: string;
};

export const SOCIAL_EXAMPLE_POSTS: SocialExamplePost[] = [
  {
    id: "example-instagram",
    platform: "instagram",
    title: "Instagram-Post (Beispiel)",
    textContent: `✨ Traumhafte 4.5-Zimmer-Wohnung in Visp – ab sofort zu vermieten!

Diese helle Wohnung überzeugt mit modernem Badezimmer und atemberaubendem Alpenblick. 🏔️

Besichtigungen ab sofort möglich!`,
    hashtags: [
      "immobilien",
      "wallis",
      "visp",
      "wohnung",
      "schweiz",
      "traumwohnung",
      "mieten",
      "immobilienwallis",
    ],
    hint: "So würde dein Post aussehen, wenn du ein Objekt online stellst",
    footerHint: "Automatisch generiert wenn du ein Objekt auf «Aktiv» setzt",
  },
  {
    id: "example-facebook",
    platform: "facebook",
    title: "Facebook-Post (Beispiel)",
    textContent: `🏠 Neue Wohnung verfügbar!

Wir freuen uns, eine wunderschöne 4.5-Zimmer-Wohnung anzubieten:

✅ 4.5 Zimmer, 95m²
✅ Modernes Badezimmer
✅ Traumhafter Alpenblick
✅ CHF 2'400 / Monat
✅ Ab sofort verfügbar

Interesse? Kontaktieren Sie uns!`,
    hashtags: [],
    hint: "Automatisch generiert wenn du ein Objekt auf «Aktiv» setzt",
    footerHint: "Ideal für lokale Reichweite auf Facebook",
  },
  {
    id: "example-linkedin",
    platform: "linkedin",
    title: "LinkedIn-Post (Beispiel)",
    textContent: `Neues Objekt in unserem Portfolio

Eine attraktive 4.5-Zimmer-Wohnung in Visp, Wallis ist ab sofort verfügbar. Der Schweizer Immobilienmarkt zeigt weiterhin starke Nachfrage in dieser Region.

Details auf Anfrage.`,
    hashtags: ["immobilien", "schweiz", "wallis", "realestate"],
    hint: "Spricht Investoren & B2B an",
    footerHint: "Professioneller Ton für LinkedIn",
  },
];
