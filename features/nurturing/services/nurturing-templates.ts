import type {
  NurturingCampaignType,
  NurturingMailTemplate,
  NurturingSettings,
} from "@/features/nurturing/types/nurturing-types";

export const DEFAULT_NURTURING_TEMPLATES: Record<
  NurturingCampaignType,
  NurturingMailTemplate
> = {
  marktupdate: {
    subject: "Aktueller Marktwert Ihrer Immobilie — {{objekt}}",
    body: `Guten Tag {{name}},

seit dem Abschluss Ihres Geschäfts rund um {{objekt}} sind einige Monate vergangen. Der Immobilienmarkt bewegt sich weiter — und viele Eigentümer wünschen sich eine aktuelle Einschätzung.

Gerne erstelle ich für Sie unverbindlich eine kurze Marktwert-Einschätzung auf Basis aktueller Vergleichswerte in Ihrer Region.

Möchten Sie, dass ich das vorbereite? Eine kurze Rückmeldung genügt.

Herzliche Grüsse
{{firma}}
{{signatur}}`,
  },
  jahrestag: {
    subject: "Ein Jahr mit {{objekt}} — herzlichen Glückwunsch!",
    body: `Guten Tag {{name}},

heute vor einem Jahr haben wir gemeinsam den Abschluss rund um {{objekt}} gefeiert. Wir hoffen, Sie fühlen sich dort weiterhin wohl!

Falls Sie Fragen zu Unterhalt, Versicherung, Steuern oder einem möglichen nächsten Schritt haben — wir sind gerne für Sie da.

Alles Gute weiterhin,
{{firma}}
{{signatur}}`,
  },
  weiterempfehlung: {
    subject: "Waren Sie zufrieden? Eine kurze Bitte von {{firma}}",
    body: `Guten Tag {{name}},

seit dem Abschluss rund um {{objekt}} sind nun sechs Monate vergangen. Wir hoffen, alles läuft wie gewünscht.

Falls Sie mit unserer Begleitung zufrieden waren, würden wir uns sehr über eine Weiterempfehlung freuen — Familie, Freunde oder Bekannte, die verkaufen, vermieten oder suchen.

Vielen Dank und beste Grüsse
{{firma}}
{{signatur}}`,
  },
};

export function createDefaultNurturingSettings(): NurturingSettings {
  return {
    marktupdateEnabled: true,
    jahrestagEnabled: true,
    weiterempfehlungEnabled: true,
    templates: {
      marktupdate: { ...DEFAULT_NURTURING_TEMPLATES.marktupdate },
      jahrestag: { ...DEFAULT_NURTURING_TEMPLATES.jahrestag },
      weiterempfehlung: { ...DEFAULT_NURTURING_TEMPLATES.weiterempfehlung },
    },
  };
}

export function cloneNurturingSettings(
  settings: NurturingSettings
): NurturingSettings {
  return {
    marktupdateEnabled: settings.marktupdateEnabled,
    jahrestagEnabled: settings.jahrestagEnabled,
    weiterempfehlungEnabled: settings.weiterempfehlungEnabled,
    templates: {
      marktupdate: { ...settings.templates.marktupdate },
      jahrestag: { ...settings.templates.jahrestag },
      weiterempfehlung: { ...settings.templates.weiterempfehlung },
    },
  };
}

export function parseNurturingSettings(raw: unknown): NurturingSettings {
  const base = createDefaultNurturingSettings();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return base;
  }

  const parsed = raw as Partial<NurturingSettings>;
  const templates = parsed.templates ?? base.templates;

  const mergeTemplate = (
    key: NurturingCampaignType
  ): NurturingMailTemplate => {
    const t = templates[key];
    if (!t || typeof t !== "object") return { ...base.templates[key] };
    return {
      subject:
        typeof t.subject === "string" && t.subject.trim()
          ? t.subject
          : base.templates[key].subject,
      body:
        typeof t.body === "string" && t.body.trim()
          ? t.body
          : base.templates[key].body,
    };
  };

  return {
    marktupdateEnabled:
      typeof parsed.marktupdateEnabled === "boolean"
        ? parsed.marktupdateEnabled
        : base.marktupdateEnabled,
    jahrestagEnabled:
      typeof parsed.jahrestagEnabled === "boolean"
        ? parsed.jahrestagEnabled
        : base.jahrestagEnabled,
    weiterempfehlungEnabled:
      typeof parsed.weiterempfehlungEnabled === "boolean"
        ? parsed.weiterempfehlungEnabled
        : base.weiterempfehlungEnabled,
    templates: {
      marktupdate: mergeTemplate("marktupdate"),
      jahrestag: mergeTemplate("jahrestag"),
      weiterempfehlung: mergeTemplate("weiterempfehlung"),
    },
  };
}

export type NurturingTemplateVars = {
  name: string;
  objekt: string;
  firma: string;
  signatur: string;
};

export function renderNurturingTemplate(
  template: NurturingMailTemplate,
  vars: NurturingTemplateVars
): NurturingMailTemplate {
  const replace = (text: string) =>
    text
      .replaceAll("{{name}}", vars.name)
      .replaceAll("{{objekt}}", vars.objekt)
      .replaceAll("{{firma}}", vars.firma)
      .replaceAll("{{signatur}}", vars.signatur);

  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}

export function plainTextToHtml(text: string): string {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

export function appendTrackingPixel(
  html: string,
  trackingUrl: string
): string {
  const pixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return `${html}${pixel}`;
}
