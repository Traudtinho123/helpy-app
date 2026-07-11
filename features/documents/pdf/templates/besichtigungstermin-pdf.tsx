import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CompanyBranding } from "@/features/documents/pdf/branding";
import type { BesichtigungsterminPayload } from "@/features/documents/pdf/types";
import {
  BrandFooter,
  BrandHeader,
  pdfColors,
  sharedPdfStyles,
} from "@/features/documents/pdf/shared";

const styles = StyleSheet.create({
  timeHero: {
    marginTop: 8,
    marginBottom: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  dateBig: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.white,
  },
  timeBig: {
    fontSize: 18,
    color: pdfColors.white,
    marginTop: 6,
  },
  duration: {
    fontSize: 9,
    color: "#DBEAFE",
    marginTop: 8,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  addressCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: pdfColors.border,
    backgroundColor: pdfColors.soft,
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  checkBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: pdfColors.border,
    marginTop: 2,
  },
});

type BesichtigungsterminPdfProps = {
  branding: CompanyBranding;
  payload: BesichtigungsterminPayload;
};

export function BesichtigungsterminPdfDocument({
  branding,
  payload,
}: BesichtigungsterminPdfProps) {
  return (
    <Document title={payload.title} author={branding.companyName}>
      <Page size="A4" style={sharedPdfStyles.page}>
        <BrandHeader
          branding={branding}
          documentLabel="Besichtigungstermin"
          metaRight={[payload.objectTitle]}
        />

        <Text
          style={{
            fontSize: 12,
            color: pdfColors.muted,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {payload.title}
        </Text>

        <View
          style={[styles.timeHero, { backgroundColor: branding.primaryColor }]}
        >
          <Text style={styles.dateBig}>{payload.dateLabel}</Text>
          <Text style={styles.timeBig}>{payload.timeLabel}</Text>
          {payload.durationLabel ? (
            <Text style={styles.duration}>{payload.durationLabel}</Text>
          ) : null}
        </View>

        <View style={styles.addressCard}>
          <Text
            style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
          >
            Treffpunkt
          </Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>
            {payload.objectTitle}
          </Text>
          <Text style={{ fontSize: 11, marginTop: 4 }}>{payload.address}</Text>
          {payload.directionsHint ? (
            <Text
              style={{
                fontSize: 9,
                color: pdfColors.muted,
                marginTop: 8,
                lineHeight: 1.45,
              }}
            >
              Anfahrt: {payload.directionsHint}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                sharedPdfStyles.sectionTitle,
                { color: branding.primaryColor },
              ]}
            >
              Besucher
            </Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
              {payload.visitor.name}
            </Text>
            {payload.visitor.email ? (
              <Text style={{ fontSize: 9, color: pdfColors.muted }}>
                {payload.visitor.email}
              </Text>
            ) : null}
            {payload.visitor.phone ? (
              <Text style={{ fontSize: 9, color: pdfColors.muted }}>
                {payload.visitor.phone}
              </Text>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                sharedPdfStyles.sectionTitle,
                { color: branding.primaryColor },
              ]}
            >
              Ansprechpartner
            </Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
              {payload.contact.name}
            </Text>
            {payload.contact.phone ? (
              <Text style={{ fontSize: 9, color: pdfColors.muted }}>
                {payload.contact.phone}
              </Text>
            ) : null}
            {payload.contact.email ? (
              <Text style={{ fontSize: 9, color: pdfColors.muted }}>
                {payload.contact.email}
              </Text>
            ) : null}
          </View>
        </View>

        <Text
          style={[sharedPdfStyles.sectionTitle, { color: branding.primaryColor }]}
        >
          Bitte mitbringen
        </Text>
        {payload.checklist.map((item) => (
          <View key={item} style={styles.checklistItem}>
            <View style={styles.checkBox} />
            <Text style={{ fontSize: 10, color: "#334155", flex: 1 }}>{item}</Text>
          </View>
        ))}

        {payload.notes ? (
          <View style={{ marginTop: 16 }}>
            <Text
              style={[
                sharedPdfStyles.sectionTitle,
                { color: branding.primaryColor },
              ]}
            >
              Hinweise
            </Text>
            <Text style={sharedPdfStyles.body}>{payload.notes}</Text>
          </View>
        ) : null}

        <BrandFooter branding={branding} />
      </Page>
    </Document>
  );
}
