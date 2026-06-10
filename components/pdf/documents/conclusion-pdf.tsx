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
  notes?: string | null;
  diagnostic?: string | null;
  allocatedBox?: string | null;
  budgetAccessCode?: string | null;
  qrCodeUrl?: string | null;
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
  warrantyBox: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  warrantyTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.black,
    marginBottom: 4,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 4,
  },
  bullet: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray400,
    lineHeight: 1.5,
  },
  instructionText: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.gray500,
    lineHeight: 1.5,
    flex: 1,
  },
});

const POST_SERVICE_INSTRUCTIONS = [
  "Evite lavagens de alta pressão diretamente sobre motores e parte elétrica.",
  "Verifique o nível de óleo e fluidos após as primeiras 500km.",
  "Em caso de retorno da anomalia, entre em contato imediatamente conosco.",
  "A garantia é válida dentro das condições normais de uso do veículo.",
];

export function ConclusionPDF({ order }: { order: OrderData }) {
  return (
    <Document
      title={`OS-${String(order.osNumber).padStart(5, "0")}-conclusao`}
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

        {/* Executed items */}
        <PdfItemsTable
          items={order.items}
          discount={order.discount}
          surcharge={order.surcharge}
          approvedOnly
        />

        {/* Warranty */}
        {order.warranty && (
          <View style={s.warrantyBox}>
            <Text style={s.warrantyTitle}>Garantia dos Serviços</Text>
            <Text style={s.textBoxContent}>{order.warranty}</Text>
          </View>
        )}

        {/* Post-service instructions */}
        <Text style={sharedStyles.sectionLabel}>Instruções Pós-Serviço</Text>
        <View style={s.textBox}>
          {POST_SERVICE_INSTRUCTIONS.map((inst, i) => (
            <View key={i} style={s.instructionRow}>
              <Text style={s.bullet}>•</Text>
              <Text style={s.instructionText}>{inst}</Text>
            </View>
          ))}
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

        <PdfFooter 
          showSignatureLine 
          signatureLabel="Assinatura do Cliente" 
          branch={order.branch} 
          qrCodeUrl={order.qrCodeUrl}
          budgetAccessCode={order.budgetAccessCode}
        />
      </Page>
    </Document>
  );
}
