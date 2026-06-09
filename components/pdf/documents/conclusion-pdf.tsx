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
  readyBanner: {
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
  },
  readyTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 2,
  },
  readySubtitle: {
    fontFamily: "Helvetica",
    fontSize: 8,
    lineHeight: 1.5,
  },
  warrantyCard: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  warrantyTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 4,
  },
  warrantyText: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    lineHeight: 1.5,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 5,
  },
  bullet: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    lineHeight: 1.1,
  },
  instructionText: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray700,
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
  const accentColor = STATUS_PDF_COLOR[order.status] ?? COLORS.pink;

  return (
    <Document
      title={`OS-${String(order.osNumber).padStart(4, "0")}-conclusao`}
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
          {/* Ready banner */}
          <View
            style={[
              s.readyBanner,
              { backgroundColor: accentColor + "18", borderWidth: 1, borderColor: accentColor + "40" },
            ]}
          >
            <Text style={[s.readyTitle, { color: accentColor }]}>
              ✓ Serviços Concluídos
            </Text>
            <Text style={[s.readySubtitle, { color: accentColor }]}>
              O veículo teve todos os serviços executados e está aguardando retirada pelo cliente.
            </Text>
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

          {/* Items executed */}
          <Text style={s.sectionTitle}>Serviços e Peças Executados</Text>
          <PdfItemsTable
            items={order.items}
            discount={order.discount}
            surcharge={order.surcharge}
            accentColor={accentColor}
            approvedOnly
          />

          {/* Warranty */}
          {order.warranty && (
            <View
              style={[
                s.warrantyCard,
                { borderColor: accentColor + "60", backgroundColor: accentColor + "08" },
              ]}
            >
              <Text style={[s.warrantyTitle, { color: accentColor }]}>
                🛡 Garantia dos Serviços
              </Text>
              <Text style={[s.warrantyText, { color: COLORS.gray700 }]}>
                {order.warranty}
              </Text>
            </View>
          )}

          {/* Post-service instructions */}
          <View style={sharedStyles.card}>
            <Text style={s.sectionTitle}>Instruções Pós-Serviço</Text>
            {POST_SERVICE_INSTRUCTIONS.map((inst, i) => (
              <View key={i} style={s.instructionRow}>
                <Text style={[s.bullet, { color: accentColor }]}>·</Text>
                <Text style={s.instructionText}>{inst}</Text>
              </View>
            ))}
          </View>

          {/* Notes */}
          {order.notes && (
            <View style={{ marginBottom: 12 }}>
              <Text style={s.sectionTitle}>Observações Adicionais</Text>
              <View style={s.infoBox}>
                <Text style={s.infoText}>{order.notes}</Text>
              </View>
            </View>
          )}
        </View>

        <PdfFooter
          status={order.status}
          warrantyText={order.warranty || undefined}
        />
      </Page>
    </Document>
  );
}
