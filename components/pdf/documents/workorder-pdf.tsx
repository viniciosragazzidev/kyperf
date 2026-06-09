"use client";

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
});

export function WorkOrderPDF({ order }: { order: OrderData }) {
  return (
    <Document
      title={`OS-${String(order.osNumber).padStart(5, "0")}-os`}
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

        {/* Diagnostic */}
        {order.diagnostic && (
          <>
            <Text style={sharedStyles.sectionLabel}>Diagnóstico Técnico</Text>
            <View style={s.textBox}>
              <Text style={s.textBoxContent}>{order.diagnostic}</Text>
            </View>
          </>
        )}

        {/* Approved items only */}
        <PdfItemsTable
          items={order.items}
          discount={order.discount}
          surcharge={order.surcharge}
          approvedOnly
        />

        {/* Notes */}
        {order.notes && (
          <>
            <Text style={sharedStyles.sectionLabel}>Observações Internas</Text>
            <View style={s.textBox}>
              <Text style={s.textBoxContent}>{order.notes}</Text>
            </View>
          </>
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
}
