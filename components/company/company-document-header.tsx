import { CompanyLogoPlaceholder } from "@/components/company/company-logo-placeholder";
import type { CompanyProfile } from "@/lib/company/company-profile";

type CompanyDocumentHeaderProps = {
  profile: CompanyProfile;
  documentTitle: string;
  meta?: { label: string; value: string }[];
  customerBlock?: {
    title: string;
    rows: { label: string; value: string }[];
  };
};

export function CompanyDocumentHeader({
  profile,
  documentTitle,
  meta = [],
  customerBlock,
}: CompanyDocumentHeaderProps) {
  return (
    <header
      className="border-b pb-8"
      style={{ borderColor: `${profile.primaryColor}20` }}
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CompanyLogoPlaceholder profile={profile} size="md" />
          <div className="mt-4 space-y-0.5 text-[11px] text-[#64748B]">
            <p>{profile.address}</p>
            <p>{profile.phone}</p>
            <p>{profile.email}</p>
            <p>{profile.website}</p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p
            className="text-[28px] font-light tracking-[-0.03em]"
            style={{ color: profile.primaryColor }}
          >
            {documentTitle}
          </p>
          {meta.length > 0 && (
            <div className="mt-3 space-y-1.5 text-[12px]">
              {meta.map(({ label, value }) => (
                <p key={label}>
                  <span className="font-medium text-[#64748B]">{label}: </span>
                  <span className="font-semibold text-[#0F172A]">{value}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {customerBlock && (
        <div
          className="mt-8 rounded-[12px] border px-5 py-4"
          style={{
            borderColor: `${profile.primaryColor}25`,
            backgroundColor: `${profile.primaryColor}06`,
          }}
        >
          <p
            className="text-[10px] font-semibold tracking-[0.08em] uppercase"
            style={{ color: profile.primaryColor }}
          >
            {customerBlock.title}
          </p>
          {customerBlock.rows.map(({ label, value }) => (
            <p key={label} className="mt-1.5 text-[12px] text-[#475569]">
              <span className="text-[#94A3B8]">{label}: </span>
              {value}
            </p>
          ))}
        </div>
      )}
    </header>
  );
}
