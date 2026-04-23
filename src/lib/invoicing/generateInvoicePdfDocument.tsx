import "server-only";

import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

type InvoicePdfItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type GenerateInvoicePdfInput = {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  companyName?: string | null;
  orgNumber?: string | null;
  address?: string | null;
  items: InvoicePdfItem[];
  amountExVat: number;
  vatAmount: number;
  amountIncVat: number;
  vatRate: number;
  currency?: string;
};

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, color: "#0f1923" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  companyHeader: { marginBottom: 14 },
  brand: { color: "#C9A84C", fontSize: 18, fontWeight: 700, marginBottom: 6 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  block: { marginBottom: 12 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d6d6d6",
    paddingBottom: 6,
    marginBottom: 6,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  colDesc: { width: "42%" },
  colQty: { width: "14%", textAlign: "right" },
  colUnit: { width: "22%", textAlign: "right" },
  colTotal: { width: "22%", textAlign: "right" },
  totals: { marginTop: 8, marginLeft: "52%" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalStrong: { fontWeight: 700 },
  footer: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#e7e7e7", paddingTop: 10, color: "#44566b" },
});

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium", timeZone: "Europe/Oslo" }).format(date);
}

function formatCurrency(amount: number, currency = "NOK"): string {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount / 100);
}

export async function generateInvoicePdf(input: GenerateInvoicePdfInput): Promise<Buffer> {
  const currency = input.currency || "NOK";
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.row, styles.companyHeader]}>
          <View>
            <Text style={styles.brand}>ArbeidMatch Norge AS</Text>
            <Text>Org.nr: 935 667 089 MVA</Text>
            <Text>Sverre Svendsens veg 38, 7056 Ranheim</Text>
            <Text>post@arbeidmatch.no</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Faktura</Text>
            <Text>Fakturanummer: {input.invoiceNumber}</Text>
            <Text>Fakturadato: {formatDate(input.invoiceDate)}</Text>
            <Text>Forfallsdato: {formatDate(input.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Kunde</Text>
          <Text>{input.companyName || "N/A"}</Text>
          {input.orgNumber ? <Text>Org.nr: {input.orgNumber}</Text> : null}
          {input.address ? <Text>{input.address}</Text> : null}
        </View>

        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Beskrivelse</Text>
            <Text style={styles.colQty}>Antall</Text>
            <Text style={styles.colUnit}>Enhetspris</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {input.items.map((item, index) => (
            <View key={`${item.description}-${index}`} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{formatCurrency(item.unit_price, currency)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total, currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal ex MVA</Text>
            <Text>{formatCurrency(input.amountExVat, currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>MVA {Math.round(input.vatRate * 100)}%</Text>
            <Text>{formatCurrency(input.vatAmount, currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalStrong}>Total inkl MVA</Text>
            <Text style={styles.totalStrong}>{formatCurrency(input.amountIncVat, currency)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Betalingsinformasjon: IBAN [TO_BE_FILLED], Kontonummer [TO_BE_FILLED]</Text>
          <Text>Takk for din bestilling. Spørsmål? post@arbeidmatch.no</Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
