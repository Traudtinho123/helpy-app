import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  formatCurrency,
  lineItemTotal,
  type CompanyBranding,
} from "@/features/documents/pdf/branding";
import type { OffertePayload } from "@/features/documents/pdf/types";
import {
  BrandFooter,
  BrandHeader,
  pdfColors,
  sharedPdfStyles,
} from "@/features/documents/pdf/shared";

const styles = StyleSheet.create({
  refBanner: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  refLabel: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: pdfColors.muted,
  },
  refValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  legalBox: {
    marginTop: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: pdfColors.border,
    backgroundColor: pdfColors.soft,
  },
  itemBlock: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
});

type OffertePdfProps = {
  branding: CompanyBranding;
  payload: OffertePayload;
};

export function OffertePdfDocument({ branding, payload }: OffertePdfProps) {
  const net = payload.lineItems.reduce(
    (sum, item) => sum + lineItemTotal(item.quantity, item.unitPrice),
    0
  );
  const vat = Math.round(net * (payload.vatRate / 100) * 100) / 100;
  const gross = Math.round((net + vat) * 100) / 100;

  return (
    <Document
      title={`${payload.referenceNumber} — ${payload.title}`}
      author={branding.companyName}
    >
      <Page size="A4" style={sharedPdfStyles.page}>
        <BrandHeader
          branding={branding}
          documentLabel="Offerte"
          metaRight={[`Ausgestellt: ${payload.issuedAt}`, `Gültig bis: ${payload.validUntil}`]}
          accentBar={false}
        />

        <View
          style={[
            styles.refBanner,
            {
              borderColor: branding.primaryColor,
              backgroundColor: `${branding.primaryColor}10`,
            },
          ]}
        >
          <Text style={styles.refLabel}>Referenznummer</Text>
          <Text style={[styles.refValue, { color: branding.primaryColor }]}>
            {payload.referenceNumber}
          </Text>
          <Text style={{ fontSize: 10, marginTop: 6, fontFamily: "Helvetica-Bold" }}>
            {payload.title}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
            >
              Auftraggeber
            </Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
              {payload.customer.company ?? payload.customer.name}
            </Text>
            {payload.customer.name && payload.customer.company ? (
              <Text style={{ fontSize: 9, color: pdfColors.muted }}>
                z. Hd. {payload.customer.name}
              </Text>
            ) : null}
            {payload.customer.address ? (
              <Text style={{ fontSize: 9, color: pdfColors.muted, marginTop: 2 }}>
                {payload.customer.address}
              </Text>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
            >
              Anbieter
            </Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
              {branding.companyName}
            </Text>
            <Text style={{ fontSize: 9, color: pdfColors.muted }}>
              {branding.address}
            </Text>
            <Text style={{ fontSize: 9, color: pdfColors.muted }}>
              {branding.taxId}
            </Text>
          </View>
        </View>

        <Text
          style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
        >
          Leistungsbeschreibung
        </Text>
        <Text style={[sharedPdfStyles.body, { marginBottom: 14 }]}>
          {payload.projectDescription}
        </Text>

        <Text
          style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
        >
          Positionen
        </Text>

        {payload.lineItems.map((item, index) => (
          <View key={item.id} style={styles.itemBlock}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, flex: 1 }}>
                {index + 1}. {item.description}
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
                {formatCurrency(lineItemTotal(item.quantity, item.unitPrice))}
              </Text>
            </View>
            {item.detail ? (
              <Text
                style={{
                  fontSize: 9,
                  color: pdfColors.muted,
                  marginTop: 4,
                  lineHeight: 1.45,
                }}
              >
                {item.detail}
              </Text>
            ) : null}
            <Text style={{ fontSize: 8, color: pdfColors.muted, marginTop: 4 }}>
              {item.quantity}
              {item.unit ? ` ${item.unit}` : " Stk."} ×{" "}
              {formatCurrency(item.unitPrice)}
            </Text>
          </View>
        ))}

        <View
          style={{
            marginTop: 8,
            padding: 12,
            backgroundColor: branding.primaryColor,
          }}
        >
          <Text style={{ color: pdfColors.white, fontSize: 9 }}>
            Offertensumme inkl. MwSt. ({payload.vatRate}%)
          </Text>
          <Text
            style={{
              color: pdfColors.white,
              fontSize: 18,
              fontFamily: "Helvetica-Bold",
              marginTop: 4,
            }}
          >
            {formatCurrency(gross)}
          </Text>
          <Text style={{ color: "#DBEAFE", fontSize: 8, marginTop: 3 }}>
            Netto {formatCurrency(net)} · MwSt. {formatCurrency(vat)}
          </Text>
        </View>

        <View style={styles.legalBox}>
          <Text
            style={[
              sharedPdfStyles.sectionTitle,
              { color: branding.primaryColor, marginBottom: 6 },
            ]}
          >
            Verbindliche Bedingungen
          </Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5, color: "#334155" }}>
            {payload.legalNotice}
          </Text>
          <Text
            style={{
              fontSize: 9,
              lineHeight: 1.5,
              color: "#334155",
              marginTop: 8,
            }}
          >
            {payload.paymentTerms}
          </Text>
        </View>

        <Text style={[sharedPdfStyles.body, { marginTop: 14 }]}>
          {payload.closing}
        </Text>

        <BrandFooter branding={branding} />
      </Page>
    </Document>
  );
}
