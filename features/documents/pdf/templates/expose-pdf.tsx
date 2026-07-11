import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { CompanyBranding } from "@/features/documents/pdf/branding";
import type { ExposePayload } from "@/features/documents/pdf/types";
import {
  BrandFooter,
  BrandHeader,
  pdfColors,
  sharedPdfStyles,
} from "@/features/documents/pdf/shared";

const styles = StyleSheet.create({
  heroTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.2,
    marginBottom: 6,
  },
  heroImage: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    marginBottom: 14,
  },
  imagePlaceholder: {
    width: "100%",
    height: 160,
    backgroundColor: pdfColors.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: pdfColors.border,
  },
  highlightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 14,
  },
  highlightCard: {
    width: "23%",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: pdfColors.soft,
    borderTopWidth: 3,
  },
  highlightValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  highlightLabel: {
    fontSize: 7,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: pdfColors.muted,
  },
  galleryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  galleryImage: {
    width: "32%",
    height: 72,
    objectFit: "cover",
  },
});

type ExposePdfProps = {
  branding: CompanyBranding;
  payload: ExposePayload;
};

export function ExposePdfDocument({ branding, payload }: ExposePdfProps) {
  const [cover, ...rest] = payload.imageUrls;
  const gallery = rest.slice(0, 3);

  return (
    <Document title={payload.title} author={branding.companyName}>
      <Page size="A4" style={sharedPdfStyles.page}>
        <BrandHeader
          branding={branding}
          documentLabel="Exposé"
          metaRight={[
            payload.transactionLabel ?? "",
            payload.priceLabel,
          ].filter(Boolean)}
        />

        {cover ? (
          <Image src={cover} style={styles.heroImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ fontSize: 10, color: pdfColors.muted }}>
              Objektbild folgt
            </Text>
          </View>
        )}

        <Text style={styles.heroTitle}>{payload.title}</Text>
        {payload.subtitle ? (
          <Text style={{ fontSize: 11, color: pdfColors.muted, marginBottom: 4 }}>
            {payload.subtitle}
          </Text>
        ) : null}
        <Text style={{ fontSize: 10, color: pdfColors.muted }}>
          {payload.address}
        </Text>
        <Text style={{ fontSize: 10, color: pdfColors.muted, marginBottom: 8 }}>
          {payload.cityLine}
        </Text>

        <Text
          style={{
            fontSize: 16,
            fontFamily: "Helvetica-Bold",
            color: branding.primaryColor,
            marginBottom: 4,
          }}
        >
          {payload.priceLabel}
        </Text>

        <View style={styles.highlightGrid}>
          {payload.highlights.slice(0, 8).map((item) => (
            <View
              key={`${item.label}-${item.value}`}
              style={[
                styles.highlightCard,
                { borderTopColor: branding.primaryColor },
              ]}
            >
              <Text style={styles.highlightLabel}>{item.label}</Text>
              <Text style={styles.highlightValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text
          style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
        >
          Beschreibung
        </Text>
        <Text style={[sharedPdfStyles.body, { marginBottom: 14 }]}>
          {payload.description}
        </Text>

        <Text
          style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
        >
          Lage
        </Text>
        <Text style={[sharedPdfStyles.body, { marginBottom: 14 }]}>
          {payload.locationText}
        </Text>

        {gallery.length > 0 ? (
          <View style={styles.galleryRow}>
            {gallery.map((url) => (
              <Image key={url} src={url} style={styles.galleryImage} />
            ))}
          </View>
        ) : null}

        <View
          style={{
            marginTop: 20,
            padding: 12,
            borderWidth: 1,
            borderColor: `${branding.primaryColor}40`,
            backgroundColor: `${branding.primaryColor}08`,
          }}
        >
          <Text
            style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
          >
            Ihr Ansprechpartner
          </Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>
            {payload.contact.name}
          </Text>
          {payload.contact.phone ? (
            <Text style={{ fontSize: 9, color: pdfColors.muted, marginTop: 2 }}>
              {payload.contact.phone}
            </Text>
          ) : null}
          {payload.contact.email ? (
            <Text style={{ fontSize: 9, color: pdfColors.muted }}>
              {payload.contact.email}
            </Text>
          ) : null}
        </View>

        <BrandFooter branding={branding} />
      </Page>
    </Document>
  );
}
