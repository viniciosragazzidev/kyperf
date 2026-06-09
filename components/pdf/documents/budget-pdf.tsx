"use client";

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PdfHeader } from "../pdf-header";
import { PdfFooter } from "../pdf-footer";
import { PdfClientVehicleBlock } from "../pdf-client-vehicle-block";
import { PdfItemsTable, PdfItem } from "../pdf-items-table";
import { COLORS, STATUS_PDF_COLOR, sharedStyles } from "../pdf-styles";

type OrderData = {
  osNumber: number;
  status: string;
  createdAt: Date | string;
  fuelLevel?: string | null;
  currentMileage: number;
  discount?: string | null;
  surcharge?: string | null;
  notes?: string | null;
  diagnostic?: string | null;
  allocatedBox?: string | null;
  customer: { name: string; phone?: string | null; document?: string | null; email?: string | null; address?: string | null } | null;
  vehicle: { brand: string; model: string; plate: string; year?: number | null; engine?: string | null } | null;
  mechanic: { name: string } | null;
  branch: { name: string; cnpj?: string | null; address?: string | null; phone?: string | null; email?: string | null } | null;
  items: PdfItem[];
};

const s = StyleSheet.create({
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    minHeight: 36,
  },
  infoText: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.gray700,
    lineHeight: 1.5,
  },
  alertBanner: {
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertText: {
    fontFamily: "Helvetica",
    fontSize: 8,
    flex: 1,
    lineHeight: 1.5,
  },
});

export function BudgetPDF({ order }: { order: OrderData }) {
  const accentColor = STATUS_PDF_COLOR[order.status] ?? COLORS.amber;
  const isPendingApproval = order.status === "AWAITING_APPROVAL";

  return (
    <Document
      title={`OS-${String(order.osNumber).padStart(4, "0")}-orcamento`}
      author="AutoManager PRO"
    >
      <Page size="A4" style={sharedStyles.page}>
        <PdfHeader
          osNumber={order.osNumber}
          status={order.status}
          createdAt={order.createdAt}
          branch={order.branch}
        />

        <View style={sharedStyles.body}>
          {/* Alert banner for approval status */}
          {isPendingApproval && (
            <View
              style={[
                s.alertBanner,
                { backgroundColor: COLORS.amber + "20", borderWidth: 1, borderColor: COLORS.amber + "50" },
              ]}
            >
              <Text style={[s.alertText, { color: "#92400E", fontFamily: "Helvetica-Bold" }]}>
                ⏳ AGUARDANDO APROVAÇÃO DO CLIENTE
              </Text>
              <Text style={[s.alertText, { color: "#78350F", fontSize: 7.5 }]}>
                Este orçamento foi enviado ao cliente e aguarda confirmação para início dos serviços.
              </Text>
            </View>
          )}

          {/* Client + Vehicle */}
          <PdfClientVehicleBlock
            customer={order.customer}
            vehicle={order.vehicle}
            fuelLevel={order.fuelLevel}
            currentMileage={order.currentMileage}
            mechanicName={order.mechanic?.name}
            allocatedBox={order.allocatedBox}
            accentColor={accentColor}
          />

          <View style={sharedStyles.divider} />

          {/* Diagnostic */}
          {order.diagnostic && (
            <View style={{ marginBottom: 14 }}>
              <Text style={s.sectionTitle}>Diagnóstico Técnico</Text>
              <View style={s.infoBox}>
                <Text style={s.infoText}>{order.diagnostic}</Text>
              </View>
            </View>
          )}

          {/* Items table with approval status */}
          <Text style={s.sectionTitle}>Itens do Orçamento</Text>
          <PdfItemsTable
            items={order.items}
            discount={order.discount}
            surcharge={order.surcharge}
            accentColor={accentColor}
            showApprovalStatus
          />

          {/* Notes */}
          {order.notes && (
            <View style={{ marginTop: 12 }}>
              <Text style={s.sectionTitle}>Observações</Text>
              <View style={s.infoBox}>
                <Text style={s.infoText}>{order.notes}</Text>
              </View>
            </View>
          )}

          {/* Client acceptance */}
          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: "row", gap: 40 }}>
              <View style={{ flex: 1 }}>
                <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray400, marginBottom: 4 }} />
                <Text style={{ fontSize: 7.5, color: COLORS.gray500, fontFamily: "Helvetica" }}>
                  Assinatura do Cliente — Aprovação do Orçamento
                </Text>
              </View>
              <View style={{ width: 100 }}>
                <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray400, marginBottom: 4 }} />
                <Text style={{ fontSize: 7.5, color: COLORS.gray500, fontFamily: "Helvetica" }}>
                  Data
                </Text>
              </View>
            </View>
          </View>
        </View>

        <PdfFooter status={order.status} validityDays={7} />
      </Page>
    </Document>
  );
}
