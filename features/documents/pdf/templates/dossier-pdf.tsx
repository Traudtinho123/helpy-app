import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { CompanyBranding } from "@/features/documents/pdf/branding";
import type { DossierPayload } from "@/features/documents/pdf/types";
import { BrandFooter, pdfColors } from "@/features/documents/pdf/shared";

const accent = "#0F766E";

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 56,
    paddingHorizontal: 42,
    fontSize: 10,
    color: pdfColors.text,
    fontFamily: "Helvetica",
  },
  masthead: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: accent,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  brandName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: accent,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  dossierLabel: {
    fontSize: 8,
    color: pdfColors.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.15,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: pdfColors.muted,
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: accent,
    marginTop: 4,
  },
  columns: {
    flexDirection: "row",
    gap: 18,
    marginTop: 12,
  },
  leftCol: {
    width: "34%",
  },
  rightCol: {
    width: "66%",
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: accent,
    marginBottom: 8,
    marginTop: 4,
  },
  factRow: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
  },
  factLabel: {
    fontSize: 7,
    color: pdfColors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  factValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.55,
    color: pdfColors.text,
    marginBottom: 8,
  },
  bullet: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 5,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: accent,
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.45,
  },
  heroImage: {
    width: "100%",
    height: 140,
    objectFit: "cover",
    marginBottom: 12,
    borderRadius: 4,
  },
  contactBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#F0FDFA",
    borderLeftWidth: 3,
    borderLeftColor: accent,
  },
});

type DossierPdfProps = {
  branding: CompanyBranding;
  payload: DossierPayload;
};

export function DossierPdfDocument({ branding, payload }: DossierPdfProps) {
  const paragraphs = payload.description.split(/\n\n+/).filter(Boolean);
  const cover = payload.imageUrls[0];

  return (
    <Document title={`Dossier — ${payload.title}`} author={branding.companyName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>{branding.companyName}</Text>
          <Text style={styles.dossierLabel}>Objekt-Dossier</Text>
        </View>

        <View style={styles.masthead}>
          <Text style={styles.title}>{payload.title}</Text>
          <Text style={styles.subtitle}>
            {payload.subtitle} · {payload.address}
          </Text>
          <Text style={styles.subtitle}>{payload.cityLine}</Text>
          <Text style={styles.price}>{payload.priceLabel}</Text>
        </View>

        {cover ? <Image src={cover} style={styles.heroImage} /> : null}

        <View style={styles.columns}>
          <View style={styles.leftCol}>
            <Text style={styles.sectionTitle}>Eckdaten</Text>
            {payload.eckdaten.map((item) => (
              <View key={item.label} style={styles.factRow}>
                <Text style={styles.factLabel}>{item.label}</Text>
                <Text style={styles.factValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.sectionTitle}>Beschreibung</Text>
            {paragraphs.map((paragraph, index) => (
              <Text key={index} style={styles.bodyText}>
                {paragraph}
              </Text>
            ))}

            <Text style={styles.sectionTitle}>Highlights</Text>
            {payload.highlights.map((item) => (
              <View key={item} style={styles.bullet}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Nächste Schritte</Text>
        {payload.nextStepActions.map((action) => (
          <View key={action} style={styles.bullet}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{action}</Text>
          </View>
        ))}

        <View style={styles.contactBox}>
          <Text style={styles.factLabel}>Kontakt</Text>
          <Text style={styles.factValue}>{payload.contact.company}</Text>
          {payload.contact.phone ? (
            <Text style={styles.bodyText}>{payload.contact.phone}</Text>
          ) : null}
          {payload.contact.email ? (
            <Text style={styles.bodyText}>{payload.contact.email}</Text>
          ) : null}
          {payload.contact.address ? (
            <Text style={styles.bodyText}>{payload.contact.address}</Text>
          ) : null}
        </View>

        <BrandFooter branding={branding} />
      </Page>
    </Document>
  );
}
