import type { CompanyProfile } from "@/lib/company/company-profile";

type CompanyDocumentFooterProps = {
  profile: CompanyProfile;
  closingText?: string;
};

export function CompanyDocumentFooter({
  profile,
  closingText,
}: CompanyDocumentFooterProps) {
  return (
    <footer className="mt-10 border-t border-[#E2E8F0] pt-8">
      {closingText && (
        <div className="whitespace-pre-line text-[12px] leading-[1.75] text-[#334155]">
          {closingText}
        </div>
      )}

      <div
        className={closingText ? "mt-10 border-t border-[#F1F5F9] pt-6" : ""}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1 text-[10px] text-[#94A3B8]">
            <p
              className="text-[11px] font-semibold"
              style={{ color: profile.primaryColor }}
            >
              {profile.companyName}
            </p>
            <p>{profile.address}</p>
            <p>
              {profile.phone} · {profile.email}
            </p>
            <p>{profile.website}</p>
          </div>
          <div className="text-left text-[10px] text-[#94A3B8] sm:text-right">
            <p>{profile.taxId}</p>
            <p>IBAN: {profile.iban}</p>
          </div>
        </div>

        {profile.footer && (
          <p className="mt-4 whitespace-pre-line border-t border-[#F1F5F9] pt-4 text-[10px] leading-relaxed text-[#94A3B8]">
            {profile.footer}
          </p>
        )}
      </div>
    </footer>
  );
}
