"use client";

import { useRef, useState } from "react";
import { Building2, Trash2, Upload } from "lucide-react";
import type { CompanyProfile } from "@/lib/company/company-profile";
import { cn } from "@/lib/utils";

type CompanyLogoPlaceholderProps = {
  profile: Pick<
    CompanyProfile,
    "logoInitials" | "companyName" | "primaryColor" | "logoUrl"
  >;
  size?: "sm" | "md" | "lg";
  showUploadHint?: boolean;
  className?: string;
};

const sizeStyles = {
  sm: {
    box: "size-10 rounded-[12px] text-[12px]",
    name: "text-[13px]",
    hint: "text-[10px]",
  },
  md: {
    box: "size-14 rounded-[14px] text-[15px]",
    name: "text-[15px]",
    hint: "text-[11px]",
  },
  lg: {
    box: "size-20 rounded-[16px] text-[20px]",
    name: "text-[17px]",
    hint: "text-[12px]",
  },
} as const;

function LogoMark({
  profile,
  boxClass,
}: {
  profile: Pick<CompanyProfile, "logoInitials" | "primaryColor" | "logoUrl">;
  boxClass: string;
}) {
  if (profile.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.logoUrl}
        alt="Firmenlogo"
        className={cn("shrink-0 object-contain", boxClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold text-white shadow-[0_4px_16px_rgba(15,23,42,0.12)]",
        boxClass
      )}
      style={{ backgroundColor: profile.primaryColor }}
    >
      {profile.logoInitials}
    </div>
  );
}

export function CompanyLogoPlaceholder({
  profile,
  size = "md",
  showUploadHint = false,
  className,
}: CompanyLogoPlaceholderProps) {
  const styles = sizeStyles[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark profile={profile} boxClass={styles.box} />

      <div className="min-w-0">
        <p
          className={cn(
            "font-semibold tracking-[-0.02em] text-[#0F172A]",
            styles.name
          )}
        >
          {profile.companyName}
        </p>
        {showUploadHint ? (
          <p className={cn("mt-0.5 text-[#64748B]", styles.hint)}>
            Firmenlogo · Upload verfügbar
          </p>
        ) : (
          <p className={cn("mt-0.5 text-[#64748B]", styles.hint)}>
            Unternehmens-Branding
          </p>
        )}
      </div>
    </div>
  );
}

type CompanyLogoUploadPlaceholderProps = {
  profile: Pick<CompanyProfile, "logoInitials" | "primaryColor" | "logoUrl">;
  onLogoChange?: (logoUrl: string | null) => void;
  className?: string;
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function CompanyLogoUploadPlaceholder({
  profile,
  onLogoChange,
  className,
}: CompanyLogoUploadPlaceholderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    if (!file || !onLogoChange) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Bitte eine Bilddatei (PNG, JPG oder SVG) wählen.");
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      setError("Logo darf maximal 2 MB groß sein.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onLogoChange(reader.result);
      }
    };
    reader.onerror = () => setError("Logo konnte nicht gelesen werden.");
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-[#CBD5E1]/70 bg-[#F8FAFC]/80 px-6 py-8 text-center",
        className
      )}
    >
      {profile.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.logoUrl}
          alt="Firmenlogo"
          className="size-16 rounded-[16px] object-contain shadow-sm"
        />
      ) : (
        <div
          className="flex size-16 items-center justify-center rounded-[16px] text-[18px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: profile.primaryColor }}
        >
          {profile.logoInitials}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 text-[#64748B] transition-colors hover:text-[#2563EB]"
        >
          <Upload className="size-4" strokeWidth={2} />
          <p className="text-[12px] font-semibold">
            {profile.logoUrl ? "Logo ersetzen" : "Logo hochladen"}
          </p>
        </button>
        <p className="mt-1 text-[11px] text-[#94A3B8]">
          PNG, JPG oder SVG · max. 2 MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      {profile.logoUrl && onLogoChange ? (
        <button
          type="button"
          onClick={() => onLogoChange(null)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-[#64748B] shadow-sm transition-colors hover:text-[#DC2626]"
        >
          <Trash2 className="size-3.5" />
          Logo entfernen
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-[#64748B] shadow-sm">
          <Building2 className="size-3.5" />
          {profile.logoUrl ? "Logo aktiv" : "Kürzel als Platzhalter"}
        </div>
      )}

      {error ? <p className="text-[11px] text-[#DC2626]">{error}</p> : null}
    </div>
  );
}
