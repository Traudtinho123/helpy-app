"use client";

import { cn } from "@/lib/utils";

export type PlatformBrandId =
  | "gmail"
  | "outlook"
  | "google-calendar"
  | "apple-calendar"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "immoscout24"
  | "homegate"
  | "newhome"
  | "whatsapp"
  | "microsoft"
  | "dropbox"
  | "bexio"
  | "default";

const BRAND_BY_INTEGRATION: Record<string, PlatformBrandId> = {
  gmail: "gmail",
  outlook: "outlook",
  "google-calendar": "google-calendar",
  "apple-calendar": "apple-calendar",
  "outlook-calendar": "outlook",
  immoscout24: "immoscout24",
  homegate: "homegate",
  newhome: "newhome",
  whatsapp: "whatsapp",
  "facebook-leads": "facebook",
  "instagram-leads": "instagram",
  "microsoft-365": "microsoft",
  dropbox: "dropbox",
  onedrive: "microsoft",
  bexio: "bexio",
  abacus: "bexio",
};

export function resolvePlatformBrand(integrationId: string): PlatformBrandId {
  return BRAND_BY_INTEGRATION[integrationId] ?? "default";
}

function GmailLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <path fill="#EA4335" d="M24 24 7 12v24h34V12L24 24z" />
      <path fill="#FBBC05" d="M7 12 24 24 7 36V12z" />
      <path fill="#34A853" d="M41 12 24 24l17 12V12z" />
      <path fill="#4285F4" d="M7 12h17v12H7V12zm17 0h17v12H24V12z" />
    </svg>
  );
}

function OutlookLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect width="48" height="48" rx="8" fill="#0078D4" />
      <path
        fill="#fff"
        d="M12 14h16a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H12V14zm4 6v12h12a2 2 0 0 0 2-2V22a2 2 0 0 0-2-2H16z"
      />
      <circle cx="18" cy="24" r="3" fill="#0078D4" />
    </svg>
  );
}

function GoogleCalendarLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect x="6" y="10" width="36" height="32" rx="4" fill="#fff" stroke="#E2E8F0" />
      <rect x="6" y="10" width="36" height="10" rx="4" fill="#4285F4" />
      <text x="24" y="34" textAnchor="middle" fill="#4285F4" fontSize="14" fontWeight="700">
        31
      </text>
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#111827" />
      <path
        fill="#fff"
        d="M30.2 24.8c.02-2.2 1.8-3.25 1.88-3.3-1.02-1.5-2.62-1.7-3.18-1.72-1.36-.14-2.65.8-3.34.8-.7 0-1.77-.78-2.92-.76-1.5.02-2.88.87-3.66 2.22-1.56 2.7-.4 6.7 1.12 8.9.74 1.08 1.62 2.28 2.78 2.24 1.12-.04 1.54-.72 2.9-.72 1.34 0 1.72.72 2.9.7 1.2-.02 1.96-1.1 2.68-2.18.84-1.24 1.2-2.44 1.22-2.5-.02-.02-2.34-.9-2.36-3.58zM27.5 15.6c.62-.76 1.04-1.82.92-2.88-.9.04-1.98.6-2.62 1.36-.58.66-1.08 1.74-.94 2.76 1 .08 2.02-.52 2.64-1.24z"
      />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <defs>
        <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FD5949" />
          <stop offset="50%" stopColor="#D6249F" />
          <stop offset="100%" stopColor="#285AEB" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ig)" />
      <rect x="12" y="12" width="24" height="24" rx="7" stroke="#fff" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="24" r="6" stroke="#fff" strokeWidth="2.5" fill="none" />
      <circle cx="33" cy="15" r="2" fill="#fff" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M28.5 25.5h-3v9h-4v-9h-2v-3.5h2V19c0-1.7 1.3-3 3-3h3v3.5h-2c-.6 0-1 .4-1 1v1h3l-.5 3.5z"
      />
    </svg>
  );
}

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M16 20h4v14h-4V20zm2-6a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6zM20 20h3.8v1.9h.1c.5-1 1.8-2.1 3.7-2.1 4 0 4.7 2.6 4.7 6V34H29v-6.7c0-1.6 0-3.6-2.2-3.6-2.2 0-2.5 1.7-2.5 3.5V34H20V20z"
      />
    </svg>
  );
}

function ImmoScoutLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#00A0E3" />
      <path fill="#fff" d="M14 32V16h6l8 10V16h6v16h-6l-8-10v10H14z" />
    </svg>
  );
}

function HomegateLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#E30613" />
      <path fill="#fff" d="M24 14 12 26h4v10h16V26h4L24 14z" />
    </svg>
  );
}

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#25D366" />
      <path
        fill="#fff"
        d="M24 14a10 10 0 0 0-8.6 15.1L14 34l5.1-1.3A10 10 0 1 0 24 14zm0 2a8 8 0 0 1 6.8 12.3l-.3.5-.2.5.4 2.3-2.4-.6-.5-.2-.5.2A8 8 0 1 1 24 16z"
      />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#F3F4F6" />
      <rect x="14" y="14" width="9" height="9" fill="#F25022" />
      <rect x="25" y="14" width="9" height="9" fill="#7FBA00" />
      <rect x="14" y="25" width="9" height="9" fill="#00A4EF" />
      <rect x="25" y="25" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function DefaultLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#E2E8F0" />
      <circle cx="24" cy="24" r="8" stroke="#64748B" strokeWidth="2" fill="none" />
    </svg>
  );
}

const LOGOS: Record<PlatformBrandId, () => React.ReactElement> = {
  gmail: GmailLogo,
  outlook: OutlookLogo,
  "google-calendar": GoogleCalendarLogo,
  "apple-calendar": AppleLogo,
  instagram: InstagramLogo,
  facebook: FacebookLogo,
  linkedin: LinkedInLogo,
  immoscout24: ImmoScoutLogo,
  homegate: HomegateLogo,
  newhome: HomegateLogo,
  whatsapp: WhatsAppLogo,
  microsoft: MicrosoftLogo,
  dropbox: DefaultLogo,
  bexio: DefaultLogo,
  default: DefaultLogo,
};

export function PlatformBrandLogo({
  brand,
  className,
}: {
  brand: PlatformBrandId;
  className?: string;
}) {
  const Logo = LOGOS[brand] ?? DefaultLogo;
  return (
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-[14px] border border-[#E2E8F0]/80 bg-white shadow-sm",
        className
      )}
    >
      <Logo />
    </span>
  );
}
