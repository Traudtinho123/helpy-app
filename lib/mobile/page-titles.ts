const PAGE_TITLES: Array<{ matches: (pathname: string) => boolean; title: string }> = [
  { matches: (p) => p === "/", title: "Heute" },
  { matches: (p) => p.startsWith("/vorgaenge") || p.startsWith("/workspace/") || p.startsWith("/vorgang/"), title: "Vorgänge" },
  { matches: (p) => p.startsWith("/kunden"), title: "Kunden" },
  { matches: (p) => p.startsWith("/kalender"), title: "Kalender" },
  { matches: (p) => p.startsWith("/objekte") || p.startsWith("/objekt/"), title: "Objekte" },
  { matches: (p) => p.startsWith("/dokumente"), title: "Dokumente" },
  { matches: (p) => p.startsWith("/telefonie") || p.startsWith("/telefonassistent"), title: "Helpy-Phone" },
  { matches: (p) => p.startsWith("/whatsapp"), title: "WhatsApp" },
  { matches: (p) => p.startsWith("/plattformen") || p.startsWith("/posteingang"), title: "Plattformen" },
  { matches: (p) => p.startsWith("/einstellungen"), title: "Einstellungen" },
];

export function resolveMobilePageTitle(pathname: string): string {
  for (const entry of PAGE_TITLES) {
    if (entry.matches(pathname)) return entry.title;
  }
  return "HELPY";
}
