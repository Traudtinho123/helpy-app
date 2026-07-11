import { StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import type { CompanyBranding } from "@/features/documents/pdf/branding";

export const pdfColors = {
  text: "#0F172A",
  muted: "#64748B",
  border: "#CBD5E1",
  soft: "#F8FAFC",
  white: "#FFFFFF",
};

export const sharedPdfStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: pdfColors.text,
    backgroundColor: pdfColors.white,
  },
  muted: {
    color: pdfColors.muted,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#334155",
  },
});

type BrandHeaderProps = {
  branding: CompanyBranding;
  documentLabel: string;
  metaRight?: string[];
  accentBar?: boolean;
};

export function BrandHeader({
  branding,
  documentLabel,
  metaRight = [],
  accentBar = true,
}: BrandHeaderProps) {
  return (
    <View>
      {accentBar ? (
        <View
          style={{
            height: 6,
            backgroundColor: branding.primaryColor,
            marginBottom: 18,
            marginHorizontal: -40,
            marginTop: -40,
          }}
        />
      ) : null}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              style={{ width: 42, height: 42, objectFit: "contain" }}
            />
          ) : (
            <View
              style={{
                width: 42,
                height: 42,
                backgroundColor: branding.primaryColor,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: pdfColors.white,
                  fontSize: 12,
                  fontFamily: "Helvetica-Bold",
                }}
              >
                {branding.logoInitials}
              </Text>
            </View>
          )}
          <View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Helvetica-Bold",
                color: pdfColors.text,
              }}
            >
              {branding.companyName}
            </Text>
            <Text style={{ fontSize: 8, color: pdfColors.muted, marginTop: 2 }}>
              {branding.address}
            </Text>
            <Text style={{ fontSize: 8, color: pdfColors.muted }}>
              {[branding.phone, branding.email].filter(Boolean).join(" · ")}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end", maxWidth: 200 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Helvetica-Bold",
              color: branding.primaryColor,
              marginBottom: 4,
            }}
          >
            {documentLabel}
          </Text>
          {metaRight.map((line) => (
            <Text key={line} style={{ fontSize: 8, color: pdfColors.muted }}>
              {line}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

type BrandFooterProps = {
  branding: CompanyBranding;
};

export function BrandFooter({ branding }: BrandFooterProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 24,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: pdfColors.border,
        paddingTop: 8,
      }}
      fixed
    >
      <Text style={{ fontSize: 7, color: pdfColors.muted, lineHeight: 1.4 }}>
        {branding.footer}
      </Text>
      <Text style={{ fontSize: 7, color: pdfColors.muted, marginTop: 3 }}>
        {[branding.companyName, branding.address, branding.phone, branding.email, branding.website]
          .filter(Boolean)
          .join(" · ")}
      </Text>
      <Text style={{ fontSize: 7, color: pdfColors.muted, marginTop: 2 }}>
        {[branding.taxId, branding.iban ? `IBAN ${branding.iban}` : ""]
          .filter(Boolean)
          .join(" · ")}
      </Text>
    </View>
  );
}
