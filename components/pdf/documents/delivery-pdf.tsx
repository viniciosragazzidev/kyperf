import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PdfHeader } from "../pdf-header";
import { PdfFooter } from "../pdf-footer";
import { PdfClientVehicleBlock } from "../pdf-client-vehicle-block";
import { PdfItemsTable, PdfItem } from "../pdf-items-table";
import { COLORS, sharedStyles } from "../pdf-styles";

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
  textBox: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 36,
    marginBottom: 14,
  },
  textBoxContent: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray500,
    lineHeight: 1.6,
  },
  paymentSection: {
    marginBottom: 14,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  receiptBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.gray200,
    borderRadius: 4,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
  receiptTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.black,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  receiptText: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 18,
  },
  signLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray400,
    width: "65%",
    marginBottom: 5,
  },
  signLabel: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray400,
  },
  dateLabel: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray400,
    marginTop: 10,
  },
});

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  Pix: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  BANK_TRANSFER: "Transferência Bancária",
  FINANCING: "Financiamento",
};

function fmtMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export function DeliveryPDF({ order }: { order: OrderData }) {
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
      title={`OS-${String(order.osNumber).padStart(5, "0")}-entrega`}
      author="KyperFix"
    >
      <Page size="A4" style={sharedStyles.page}>
        <PdfHeader
          osNumber={order.osNumber}
          status={order.status}
          createdAt={order.createdAt}
          branch={order.branch}
          customer={order.customer}
          vehicle={order.vehicle}
          items={order.items}
          discount={order.discount}
          surcharge={order.surcharge}
          fuelLevel={order.fuelLevel}
          currentMileage={order.currentMileage}
          mechanicName={order.mechanic?.name}
          allocatedBox={order.allocatedBox}
        />

        {/* Items */}
        <PdfItemsTable
          items={order.items}
          discount={order.discount}
          surcharge={order.surcharge}
          approvedOnly
        />

        {/* Payment method section */}
        <View style={s.paymentSection}>
          <Text style={sharedStyles.sectionLabel}>Método de Pagamento</Text>
          <View style={s.textBox}>
            <View style={s.paymentRow}>
              <Text style={s.textBoxContent}>{payLabel}</Text>
            </View>
            {order.warranty && (
              <View style={s.paymentRow}>
                <Text style={[s.textBoxContent, { fontSize: 8, marginTop: 4 }]}>
                  Garantia: {order.warranty}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <>
            <Text style={sharedStyles.sectionLabel}>Observações</Text>
            <View style={s.textBox}>
              <Text style={s.textBoxContent}>{order.notes}</Text>
            </View>
          </>
        )}

        {/* Receipt / signature box */}
        <View style={s.receiptBox}>
          <Text style={s.receiptTitle}>Recibo de Entrega</Text>
          <Text style={s.receiptText}>
            Recebi da oficina acima o veículo descrito neste documento em perfeitas{"\n"}
            condições, juntamente com os serviços aqui elencados, conforme acordado.
          </Text>
          <View style={s.signLine} />
          <Text style={s.signLabel}>
            Assinatura do Cliente — {order.customer?.name || ""}
          </Text>
          <Text style={s.dateLabel}>
            Data: ______ / ______ / __________
          </Text>
        </View>

        <PdfFooter
          noteText="Este documento serve como comprovante de entrega do veículo e dos serviços realizados."
          paymentMethod={order.paymentMethod}
          branch={order.branch}
        />
      </Page>
    </Document>
  );
}
