import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  formatCurrency,
  lineItemTotal,
  type CompanyBranding,
} from "@/features/documents/pdf/branding";
import type { AngebotPayload } from "@/features/documents/pdf/types";
import {
  BrandFooter,
  BrandHeader,
  pdfColors,
  sharedPdfStyles,
} from "@/features/documents/pdf/shared";

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  priceHero: {
    marginTop: 16,
    marginBottom: 18,
    padding: 14,
    backgroundColor: pdfColors.soft,
    borderLeftWidth: 4,
  },
  priceHeroLabel: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: pdfColors.muted,
    marginBottom: 4,
  },
  priceHeroValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: pdfColors.soft,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  colPos: { width: "8%" },
  colDesc: { width: "44%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "18%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  cellHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.muted,
  },
  signatureBox: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
  },
  signatureLine: {
    marginTop: 36,
    borderTopWidth: 1,
    borderTopColor: pdfColors.border,
    paddingTop: 6,
    width: "45%",
  },
});

type AngebotPdfProps = {
  branding: CompanyBranding;
  payload: AngebotPayload;
};

export function AngebotPdfDocument({ branding, payload }: AngebotPdfProps) {
  const net = payload.lineItems.reduce(
    (sum, item) => sum + lineItemTotal(item.quantity, item.unitPrice),
    0
  );
  const vat = Math.round(net * (payload.vatRate / 100) * 100) / 100;
  const gross = Math.round((net + vat) * 100) / 100;

  return (
    <Document
      title={`${payload.documentNumber} — ${payload.title}`}
      author={branding.companyName}
    >
      <Page size="A4" style={sharedPdfStyles.page}>
        <BrandHeader
          branding={branding}
          documentLabel="Angebot"
          metaRight={[
            `Nr. ${payload.documentNumber}`,
            `Datum: ${payload.issuedAt}`,
            `Gültig bis: ${payload.validUntil}`,
          ]}
        />

        <Text style={styles.title}>{payload.title}</Text>
        <Text style={{ fontSize: 10, color: pdfColors.muted, marginBottom: 12 }}>
          Für {payload.customer.company ?? payload.customer.name}
          {payload.customer.address ? ` · ${payload.customer.address}` : ""}
        </Text>

        <View
          style={[styles.priceHero, { borderLeftColor: branding.primaryColor }]}
        >
          <Text style={styles.priceHeroLabel}>Gesamtbetrag inkl. MwSt.</Text>
          <Text style={[styles.priceHeroValue, { color: branding.primaryColor }]}>
            {formatCurrency(gross)}
          </Text>
          <Text style={{ fontSize: 8, color: pdfColors.muted, marginTop: 4 }}>
            Netto {formatCurrency(net)} · MwSt. {payload.vatRate}%{" "}
            {formatCurrency(vat)}
          </Text>
        </View>

        <Text style={sharedPdfStyles.body}>{payload.intro}</Text>

        <Text
          style={[
            sharedPdfStyles.sectionTitle,
            { color: branding.primaryColor, marginTop: 20 },
          ]}
        >
          Leistungen & Konditionen
        </Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.cellHeader, styles.colPos]}>#</Text>
          <Text style={[styles.cellHeader, styles.colDesc]}>Leistung</Text>
          <Text style={[styles.cellHeader, styles.colQty]}>Menge</Text>
          <Text style={[styles.cellHeader, styles.colPrice]}>Einzelpreis</Text>
          <Text style={[styles.cellHeader, styles.colTotal]}>Summe</Text>
        </View>

        {payload.lineItems.map((item, index) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colPos}>{item.position ?? index + 1}</Text>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>
              {item.quantity}
              {item.unit ? ` ${item.unit}` : ""}
            </Text>
            <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>
              {formatCurrency(lineItemTotal(item.quantity, item.unitPrice))}
            </Text>
          </View>
        ))}

        <View style={{ marginTop: 14, alignItems: "flex-end" }}>
          <Text style={{ fontSize: 9, color: pdfColors.muted }}>
            Netto: {formatCurrency(net)}
          </Text>
          <Text style={{ fontSize: 9, color: pdfColors.muted, marginTop: 2 }}>
            MwSt. ({payload.vatRate}%): {formatCurrency(vat)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Helvetica-Bold",
              marginTop: 4,
              color: branding.primaryColor,
            }}
          >
            Gesamt: {formatCurrency(gross)}
          </Text>
        </View>

        <Text
          style={[
            sharedPdfStyles.sectionTitle,
            { color: branding.primaryColor, marginTop: 22 },
          ]}
        >
          Zahlungsbedingungen
        </Text>
        <Text style={sharedPdfStyles.body}>{payload.paymentTerms}</Text>

        <Text style={[sharedPdfStyles.body, { marginTop: 14 }]}>
          {payload.closing}
        </Text>

        <View style={styles.signatureBox}>
          <View style={styles.signatureLine}>
            <Text style={{ fontSize: 8, color: pdfColors.muted }}>
              {payload.signatureLabel ?? "Unterschrift Anbieter"}
            </Text>
          </View>
          <View style={styles.signatureLine}>
            <Text style={{ fontSize: 8, color: pdfColors.muted }}>
              Unterschrift Kunde
            </Text>
          </View>
        </View>

        <BrandFooter branding={branding} />
      </Page>
    </Document>
  );
}
