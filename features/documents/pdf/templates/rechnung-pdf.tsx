import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  formatCurrency,
  lineItemTotal,
  type CompanyBranding,
} from "@/features/documents/pdf/branding";
import type { RechnungPayload } from "@/features/documents/pdf/types";
import {
  BrandFooter,
  BrandHeader,
  pdfColors,
  sharedPdfStyles,
} from "@/features/documents/pdf/shared";

const styles = StyleSheet.create({
  invoiceBanner: {
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
  colDesc: { width: "52%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "18%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  cellHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.muted,
  },
  totalsBox: {
    marginTop: 12,
    alignSelf: "flex-end",
    width: "45%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  ibanBox: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: pdfColors.border,
    backgroundColor: pdfColors.soft,
  },
});

type RechnungPdfProps = {
  branding: CompanyBranding;
  payload: RechnungPayload;
};

export function RechnungPdfDocument({ branding, payload }: RechnungPdfProps) {
  const net = payload.lineItems.reduce(
    (sum, item) => sum + lineItemTotal(item.quantity, item.unitPrice),
    0
  );
  const vat = Math.round(net * (payload.vatRate / 100) * 100) / 100;
  const gross = Math.round((net + vat) * 100) / 100;

  return (
    <Document
      title={`${payload.invoiceNumber} — Rechnung`}
      author={branding.companyName}
    >
      <Page size="A4" style={sharedPdfStyles.page}>
        <BrandHeader
          branding={branding}
          documentLabel="Rechnung"
          metaRight={[
            `Datum: ${payload.issuedAt}`,
            `Fällig: ${payload.dueAt}`,
          ]}
        />

        <View
          style={[
            styles.invoiceBanner,
            {
              borderColor: branding.primaryColor,
              backgroundColor: `${branding.primaryColor}10`,
            },
          ]}
        >
          <Text style={styles.refLabel}>Rechnungsnummer</Text>
          <Text style={[styles.refValue, { color: branding.primaryColor }]}>
            {payload.invoiceNumber}
          </Text>
          {payload.objectLabel ? (
            <Text style={{ fontSize: 9, marginTop: 6, color: pdfColors.muted }}>
              Objekt: {payload.objectLabel}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
            >
              Rechnungsempfänger
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
              Rechnungssteller
            </Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
              {branding.companyName}
            </Text>
            <Text style={{ fontSize: 9, color: pdfColors.muted, marginTop: 2 }}>
              {branding.address}
            </Text>
            {branding.taxId ? (
              <Text style={{ fontSize: 9, color: pdfColors.muted, marginTop: 2 }}>
                {branding.taxId}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.cellHeader, styles.colDesc]}>Beschreibung</Text>
          <Text style={[styles.cellHeader, styles.colQty]}>Menge</Text>
          <Text style={[styles.cellHeader, styles.colPrice]}>Einzelpreis</Text>
          <Text style={[styles.cellHeader, styles.colTotal]}>Total</Text>
        </View>

        {payload.lineItems.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.colDesc, { fontSize: 9 }]}>{item.description}</Text>
            <Text style={[styles.colQty, { fontSize: 9 }]}>
              {item.quantity} {item.unit ?? ""}
            </Text>
            <Text style={[styles.colPrice, { fontSize: 9 }]}>
              {formatCurrency(item.unitPrice, "CHF")}
            </Text>
            <Text style={[styles.colTotal, { fontSize: 9, fontFamily: "Helvetica-Bold" }]}>
              {formatCurrency(lineItemTotal(item.quantity, item.unitPrice), "CHF")}
            </Text>
          </View>
        ))}

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={{ fontSize: 9, color: pdfColors.muted }}>Netto</Text>
            <Text style={{ fontSize: 9 }}>{formatCurrency(net, "CHF")}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ fontSize: 9, color: pdfColors.muted }}>
              MwSt. ({payload.vatRate} %)
            </Text>
            <Text style={{ fontSize: 9 }}>{formatCurrency(vat, "CHF")}</Text>
          </View>
          <View
            style={[
              styles.totalRow,
              {
                marginTop: 4,
                paddingTop: 6,
                borderTopWidth: 1,
                borderTopColor: pdfColors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>Total</Text>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>
              {formatCurrency(gross, "CHF")}
            </Text>
          </View>
        </View>

        <View style={styles.ibanBox}>
          <Text style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}>
            Zahlungsinformationen
          </Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
            {payload.paymentTerms}
          </Text>
          {branding.iban ? (
            <Text style={{ fontSize: 9, marginTop: 6, fontFamily: "Helvetica-Bold" }}>
              IBAN: {branding.iban}
            </Text>
          ) : null}
        </View>

        {payload.closing ? (
          <Text style={[sharedPdfStyles.body, { marginTop: 16 }]}>
            {payload.closing}
          </Text>
        ) : null}

        <BrandFooter branding={branding} />
      </Page>
    </Document>
  );
}
