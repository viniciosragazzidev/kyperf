"use client";

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PdfHeader } from "../pdf-header";
import { PdfFooter } from "../pdf-footer";
import { PdfClientVehicleBlock } from "../pdf-client-vehicle-block";
import { COLORS, STATUS_PDF_COLOR, sharedStyles } from "../pdf-styles";

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
  checklistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "22%",
    backgroundColor: COLORS.gray50,
    borderRadius: 4,
    padding: 5,
    gap: 4,
  },
  checkBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gray300,
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
    fontSize: 7.5,
    color: COLORS.gray700,
  },
  damagesBox: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    padding: 10,
    minHeight: 48,
    marginBottom: 12,
  },
  damagesText: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.gray700,
    lineHeight: 1.5,
  },
  noteBox: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    padding: 10,
    minHeight: 36,
    marginBottom: 12,
  },
});

const CHECKLIST_ITEMS = [
  "Estepe",
  "Macaco",
  "Chave de Roda",
  "Triângulo",
  "Manual",
  "Extintor",
  "Tapetes",
  "Antena",
];

interface CheckItem {
  label: string;
  checked: boolean;
}

function parseChecklist(raw?: string | null): CheckItem[] {
  if (!raw) return CHECKLIST_ITEMS.map((l) => ({ label: l, checked: false }));
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return CHECKLIST_ITEMS.map((label) => ({
        label,
        checked: parsed.includes(label),
      }));
    }
  } catch {}
  return CHECKLIST_ITEMS.map((l) => ({ label: l, checked: false }));
}

export function CheckInPDF({ order }: { order: OrderData }) {
  const accentColor = STATUS_PDF_COLOR[order.status] ?? COLORS.blue;
  const checklistItems = parseChecklist(order.checklist);

  return (
    <Document
      title={`OS-${String(order.osNumber).padStart(4, "0")}-checkin`}
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

          {/* Checklist */}
          <View style={sharedStyles.card}>
            <Text style={s.sectionTitle}>Checklist de Acessórios</Text>
            <View style={s.checklistGrid}>
              {checklistItems.map((item) => (
                <View key={item.label} style={s.checkItem}>
                  <View style={[s.checkBox, item.checked ? s.checkBoxFilled : {}]}>
                    {item.checked && <Text style={s.checkMark}>✓</Text>}
                  </View>
                  <Text style={s.checkLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Damages */}
          <View style={{ marginBottom: 12 }}>
            <Text style={s.sectionTitle}>Avarias e Observações de Entrada</Text>
            <View style={s.damagesBox}>
              <Text style={s.damagesText}>
                {order.damages || "Nenhuma avaria registrada."}
              </Text>
            </View>
          </View>

          {/* Diagnostic */}
          {order.diagnostic && (
            <View style={{ marginBottom: 12 }}>
              <Text style={s.sectionTitle}>Diagnóstico Inicial</Text>
              <View style={s.noteBox}>
                <Text style={s.damagesText}>{order.diagnostic}</Text>
              </View>
            </View>
          )}

          {/* Signature */}
          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: "row", gap: 40 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.gray400,
                    marginBottom: 4,
                  }}
                />
                <Text style={{ fontSize: 7.5, color: COLORS.gray500, fontFamily: "Helvetica" }}>
                  Assinatura do Cliente — Confirmo as informações acima
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.gray400,
                    marginBottom: 4,
                  }}
                />
                <Text style={{ fontSize: 7.5, color: COLORS.gray500, fontFamily: "Helvetica" }}>
                  Assinatura do Receptor / Responsável
                </Text>
              </View>
            </View>
          </View>
        </View>

        <PdfFooter status={order.status} />
      </Page>
    </Document>
  );
}
