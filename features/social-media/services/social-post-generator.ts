import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import type {
  GeneratedSocialPosts,
  SocialPlatform,
} from "@/features/social-media/types/social-media-types";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

export type SocialObjectSnapshot = {
  titel: string;
  beschreibung: string;
  adresse: string;
  plz: string;
  ort: string;
  land: string;
  preis: string | null;
  zimmer: string | null;
  wohnflaeche: string | null;
  stockwerk: string | null;
  baujahr: string | null;
  verfuegbarkeit: string | null;
  transaktion: string | null;
};

export function buildSocialObjectSnapshot(
  object: RealEstateObject
): SocialObjectSnapshot {
  return {
    titel: object.titel,
    beschreibung: object.beschreibung,
    adresse: object.adresse,
    plz: object.plz,
    ort: object.ort,
    land: object.land,
    preis: object.preis,
    zimmer: object.zimmer,
    wohnflaeche: object.wohnflaeche,
    stockwerk: object.stockwerk,
    baujahr: object.baujahr ?? null,
    verfuegbarkeit: object.verfuegbarkeit ?? null,
    transaktion: object.transaktion,
  };
}

function formatObjectBlock(snapshot: SocialObjectSnapshot): string {
  return [
    `Titel: ${snapshot.titel}`,
    `Adresse: ${snapshot.adresse}, ${snapshot.plz} ${snapshot.ort}, ${snapshot.land}`,
    snapshot.transaktion ? `Transaktion: ${snapshot.transaktion}` : null,
    snapshot.preis ? `Preis: ${snapshot.preis}` : null,
    snapshot.zimmer ? `Zimmer: ${snapshot.zimmer}` : null,
    snapshot.wohnflaeche ? `Wohnfläche: ${snapshot.wohnflaeche}` : null,
    snapshot.stockwerk ? `Stockwerk: ${snapshot.stockwerk}` : null,
    snapshot.baujahr ? `Baujahr: ${snapshot.baujahr}` : null,
    snapshot.verfuegbarkeit ? `Verfügbarkeit: ${snapshot.verfuegbarkeit}` : null,
    snapshot.beschreibung ? `Beschreibung: ${snapshot.beschreibung}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

const PLATFORM_PROMPTS: Record<SocialPlatform, string> = {
  instagram: `Erstelle einen Instagram-Post für ein Schweizer Immobilienunternehmen.
Regeln:
- Emoji am Anfang und zwischendrin
- Emotional, inspirierend, nicht trocken
- Konkrete Objekt-Details erwähnen (Zimmer, Lage, besonderes Merkmal)
- Call-to-Action am Ende
- Max 2000 Zeichen
- 8-12 Hashtags am Ende: Mix aus allgemein + lokal + spezifisch
Antworte NUR mit dem Post-Text.`,

  facebook: `Erstelle einen Facebook-Post für ein Schweizer Immobilienunternehmen.
Regeln:
- Professionell aber persönlich
- Konkrete Fakten in strukturierter Form (Aufzählung mit ✅ oder 📍)
- Ohne viele Hashtags (max 3)
- Call-to-Action mit Kontakt
- Max 500 Zeichen
Antworte NUR mit dem Post-Text.`,

  linkedin: `Erstelle einen LinkedIn-Post für ein Schweizer Immobilienunternehmen.
Regeln:
- Professionell und sachlich
- B2B Tonalität (spricht Investoren/Unternehmen an)
- Marktkontext kurz erwähnen (warum jetzt ein guter Zeitpunkt ist)
- Keine Emojis ausser 1-2 dezente
- Call-to-Action professionell
- Max 700 Zeichen
- 3-5 professionelle Hashtags
Antworte NUR mit dem Post-Text.`,
};

function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function isSocialGptConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

async function callOpenAi(prompt: string, objectBlock: string, companyStyle: string): Promise<string | null> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.55,
        max_tokens: 900,
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: `Objektdaten:\n${objectBlock}\n\nFirmenstil:\n${companyStyle}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[social-media] OpenAI failed:", response.status);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error(
      "[social-media] OpenAI error:",
      error instanceof Error ? error.message : "unknown"
    );
    return null;
  }
}

function buildFallbackPost(
  platform: SocialPlatform,
  snapshot: SocialObjectSnapshot,
  companyName: string
): string {
  const location = `${snapshot.ort}`;
  const rooms = snapshot.zimmer ? `${snapshot.zimmer} Zimmer` : "Wohnung";
  const price = snapshot.preis ?? "Preis auf Anfrage";

  if (platform === "instagram") {
    return `✨ ${rooms} in ${location} — ${snapshot.titel}

Entdecken Sie diese attraktive Immobilie in ${snapshot.adresse}, ${snapshot.plz} ${snapshot.ort}.
${snapshot.wohnflaeche ? `📐 ${snapshot.wohnflaeche}` : ""}${snapshot.stockwerk ? ` · Stock ${snapshot.stockwerk}` : ""}
💰 ${price}

Jetzt Besichtigung vereinbaren — ${companyName} begleitet Sie persönlich.

#immobilien #${location.toLowerCase().replace(/\s+/g, "")} #wohnung #schweiz #immobilienmarkt #traumwohnung #helpy #makler #mietenwohnung #neueszuhause`;
  }

  if (platform === "facebook") {
    return `🏠 Neu online: ${snapshot.titel}

📍 ${snapshot.adresse}, ${snapshot.plz} ${snapshot.ort}
✅ ${rooms} · ${price}
${snapshot.wohnflaeche ? `✅ ${snapshot.wohnflaeche} Wohnfläche` : ""}

Interesse? Kontaktieren Sie ${companyName} für eine Besichtigung.

#immobilien #${location.toLowerCase()}`;
  }

  return `Neues Objekt im Portfolio: ${snapshot.titel}

${rooms} in ${location} — ${price}. Der regionale Markt in ${location} bleibt gefragt; gut platzierte Objekte finden aktuell schnell Interessenten.

${companyName} unterstützt Sie bei Besichtigung und Due Diligence.

#Immobilien #${location} #Schweiz #Investment`;
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [...new Set(matches.map((tag) => tag.replace(/^#/, "").toLowerCase()))];
}

export function stripHashtagsFromText(text: string): string {
  return text.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/\s+\n/g, "\n").trim();
}

export async function generateSocialPostsWithGpt(input: {
  snapshot: SocialObjectSnapshot;
  companyName: string;
  companyStyle: string;
}): Promise<GeneratedSocialPosts> {
  const objectBlock = formatObjectBlock(input.snapshot);
  const companyStyle =
    input.companyStyle.trim() ||
    `${input.companyName} — professionell, nahbar, Schweizer Immobilienexperte.`;

  const results = await Promise.all(
    (["instagram", "facebook", "linkedin"] as SocialPlatform[]).map(
      async (platform) => {
        const gpt =
          (await callOpenAi(
            PLATFORM_PROMPTS[platform],
            objectBlock,
            companyStyle
          )) ?? buildFallbackPost(platform, input.snapshot, input.companyName);
        return [platform, gpt] as const;
      }
    )
  );

  return Object.fromEntries(results) as GeneratedSocialPosts;
}

export function resolveCoverImageUrl(object: RealEstateObject): string | null {
  const cover =
    object.images.find((image) => image.isCover && image.status === "bestätigt") ??
    object.images.find((image) => image.status === "bestätigt") ??
    object.images[0] ??
    null;
  if (!cover?.url) return null;
  if (cover.url.startsWith("http://") || cover.url.startsWith("https://")) {
    return cover.url;
  }
  return null;
}
