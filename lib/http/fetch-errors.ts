/** Erkennt Vercel-Edge-403 (WAF / Deployment Protection). */
export function isVercelEdgeForbidden(text: string): boolean {
  return (
    text.includes("403: Forbidden") ||
    (text.includes("Forbidden") && /fra\d::/.test(text))
  );
}

export function vercelEdgeForbiddenMessage(): string {
  return "Zugriff durch Vercel blockiert (403). Bitte Deployment Protection / Firewall im Vercel-Dashboard prüfen oder die Production-Domain nutzen.";
}

export async function readApiErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const raw = await response.text().catch(() => "");
  if (isVercelEdgeForbidden(raw)) {
    return vercelEdgeForbiddenMessage();
  }

  try {
    const payload = JSON.parse(raw) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return raw.trim() || fallback;
  }
}
