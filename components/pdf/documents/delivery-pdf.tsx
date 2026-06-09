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
  warranty?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
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
  paymentCard: {
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIcon: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
  },
  paymentLabel: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  paymentValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
  receiptBox: {
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.gray300,
    padding: 16,
    marginTop: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  receiptTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.gray600,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  receiptSignLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray400,
    width: "70%",
    marginBottom: 5,
  },
  receiptSignLabel: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray500,
  },
});

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  BANK_TRANSFER: "Transferência Bancária",
  FINANCING: "Financiamento",
};

function fmtMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export function DeliveryPDF({ order }: { order: OrderData }) {
  const accentColor = STATUS_PDF_COLOR[order.status] ?? COLORS.emerald;

  const subtotal = order.items
    .filter((i) => i.isApproved === 1)
    .reduce((acc, i) => acc + i.quantity * parseFloat(i.unitSalePrice), 0);
  const disc = parseFloat(order.discount || "0");
  const sur = parseFloat(order.surcharge || "0");
  const grand = Math.max(0, subtotal - disc + sur);

  const payLabel =
    order.paymentMethod
      ? PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod
      : "Não informado";

  return (
    <Document
      title={`OS-${String(order.osNumber).padStart(4, "0")}-entrega`}
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
          {/* Payment summary */}
          <View
            style={[
              s.paymentCard,
              { backgroundColor: accentColor + "14", borderWidth: 1, borderColor: accentColor + "40" },
            ]}
          >
            <Text style={[s.paymentIcon, { color: accentColor }]}>✓</Text>
            <View>
              <Text style={s.paymentLabel}>Total Pago · {payLabel}</Text>
              <Text style={[s.paymentValue, { color: accentColor }]}>
                {fmtMoney(grand)}
              </Text>
            </View>
          </View>

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

          {/* Items */}
          <Text style={s.sectionTitle}>Serviços e Peças Entregues</Text>
          <PdfItemsTable
            items={order.items}
            discount={order.discount}
            surcharge={order.surcharge}
            accentColor={accentColor}
            approvedOnly
          />

          {/* Warranty */}
          {order.warranty && (
            <View style={{ marginTop: 12, marginBottom: 12 }}>
              <Text style={s.sectionTitle}>Garantia</Text>
              <View style={[s.infoBox, { borderColor: accentColor + "50" }]}>
                <Text style={s.infoText}>{order.warranty}</Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {order.notes && (
            <View style={{ marginBottom: 12 }}>
              <Text style={s.sectionTitle}>Observações</Text>
              <View style={s.infoBox}>
                <Text style={s.infoText}>{order.notes}</Text>
              </View>
            </View>
          )}

          {/* Receipt signature block */}
          <View style={s.receiptBox}>
            <Text style={s.receiptTitle}>Recibo de Entrega</Text>
            <Text
              style={{
                fontFamily: "Helvetica",
                fontSize: 8,
                color: COLORS.gray500,
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Recebi da oficina acima o veículo descrito neste documento em perfeitas condições,{"\n"}
              juntamente com os serviços aqui elencados, conforme acordado.
            </Text>
            <View style={s.receiptSignLine} />
            <Text style={s.receiptSignLabel}>
              Assinatura do Cliente — {order.customer?.name || ""}
            </Text>
            <Text
              style={[s.receiptSignLabel, { marginTop: 8, color: COLORS.gray400 }]}
            >
              Data: ______ / ______ / __________
            </Text>
          </View>
        </View>

        <PdfFooter
          status={order.status}
          warrantyText={order.warranty || undefined}
        />
      </Page>
    </Document>
  );
}
