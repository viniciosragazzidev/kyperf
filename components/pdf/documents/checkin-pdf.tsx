import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PdfHeader } from "../pdf-header";
import { PdfFooter } from "../pdf-footer";
import { PdfClientVehicleBlock } from "../pdf-client-vehicle-block";
import { COLORS, sharedStyles } from "../pdf-styles";

type OrderData = {
  osNumber: number;
  status: string;
  createdAt: Date | string;
  fuelLevel?: string | null;
  currentMileage: number;
  damages?: string | null;
  checklist?: string | null;
  notes?: string | null;
  diagnostic?: string | null;
  allocatedBox?: string | null;
  customer: { name: string; phone?: string | null; document?: string | null; email?: string | null; address?: string | null } | null;
  vehicle: { brand: string; model: string; plate: string; year?: number | null; engine?: string | null } | null;
  mechanic: { name: string } | null;
  branch: { name: string; cnpj?: string | null; address?: string | null; phone?: string | null; email?: string | null } | null;
};

const s = StyleSheet.create({
  checkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "23%",
    gap: 5,
  },
  checkBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxFilled: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  checkMark: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.white,
  },
  checkLabel: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray700,
  },
  textBox: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
    marginBottom: 14,
  },
  textBoxContent: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray500,
    lineHeight: 1.6,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 40,
    marginTop: 30,
  },
  signatureCol: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray400,
    marginBottom: 5,
  },
  signatureLabel: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray400,
  },
});

const CHECKLIST_ITEMS = [
  "Estepe", "Macaco", "Chave de Roda", "Triângulo",
  "Manual", "Extintor", "Tapetes", "Antena",
];

function parseChecklist(raw?: string | null) {
  if (!raw) return CHECKLIST_ITEMS.map((l) => ({ label: l, checked: false }));
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return CHECKLIST_ITEMS.map((label) => ({ label, checked: parsed.includes(label) }));
  } catch { }
  return CHECKLIST_ITEMS.map((l) => ({ label: l, checked: false }));
}

export function CheckInPDF({ order }: { order: OrderData }) {
  const items = parseChecklist(order.checklist);

  return (
    <Document
      title={`OS-${String(order.osNumber).padStart(5, "0")}-checkin`}
      author="KyperFix"
    >
      <Page size="A4" style={sharedStyles.page}>
        <PdfHeader
          osNumber={order.osNumber}
          status={order.status}
          createdAt={order.createdAt}
          branch={order.branch}
        />

        <PdfClientVehicleBlock
          customer={order.customer}
          vehicle={order.vehicle}
          fuelLevel={order.fuelLevel}
          currentMileage={order.currentMileage}
          mechanicName={order.mechanic?.name}
          allocatedBox={order.allocatedBox}
        />

        {/* Checklist */}
        <Text style={sharedStyles.sectionLabel}>Checklist de Acessórios</Text>
        <View style={s.checkGrid}>
          {items.map((item) => (
            <View key={item.label} style={s.checkItem}>
              <View style={[s.checkBox, item.checked ? s.checkBoxFilled : {}]}>
                {item.checked && <Text style={s.checkMark}>✓</Text>}
              </View>
              <Text style={s.checkLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={sharedStyles.dividerLight} />

        {/* Damages */}
        <Text style={sharedStyles.sectionLabel}>Avarias Registradas</Text>
        <View style={s.textBox}>
          <Text style={s.textBoxContent}>
            {order.damages || "Nenhuma avaria registrada."}
          </Text>
        </View>

        {/* Diagnostic */}
        {order.diagnostic && (
          <>
            <Text style={sharedStyles.sectionLabel}>Diagnóstico Inicial</Text>
            <View style={s.textBox}>
              <Text style={s.textBoxContent}>{order.diagnostic}</Text>
            </View>
          </>
        )}

        {/* Notes */}
        {order.notes && (
          <>
            <Text style={sharedStyles.sectionLabel}>Observações</Text>
            <View style={s.textBox}>
              <Text style={s.textBoxContent}>{order.notes}</Text>
            </View>
          </>
        )}

        {/* Two signatures */}
        <View style={s.signatureRow}>
          <View style={s.signatureCol}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Assinatura do Cliente</Text>
          </View>
          <View style={s.signatureCol}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Responsável / Receptor</Text>
          </View>
        </View>

        <PdfFooter
          noteText="O cliente declara que as informações acima conferem com o estado do veículo no momento da entrada na oficina."
          showSignatureLine={false}
        />
      </Page>
    </Document>
  );
}
