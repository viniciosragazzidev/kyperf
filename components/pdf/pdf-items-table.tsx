import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, sharedStyles } from "./pdf-styles";

export interface PdfItem {
  id: string;
  type: string;
  customName?: string | null;
  quantity: number;
  unitSalePrice: string;
  isApproved: number;
  partName?: string | null;
  partBrand?: string | null;
  serviceName?: string | null;
}

interface Props {
  items: PdfItem[];
  discount?: string | null;
  surcharge?: string | null;
  approvedOnly?: boolean;
  showApprovalStatus?: boolean;
}

const s = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.black,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  colSl:    { width: 25, textAlign: "center" },
  colDesc:  { flex: 1 },
  colPrice: { width: 80, textAlign: "right" },
  colUnits: { width: 50, textAlign: "center" },
  colAppr:  { width: 40, textAlign: "center" },
  colTotal: { width: 80, textAlign: "right" },

  thText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
    alignItems: "center",
  },
  cellText: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray700,
  },
  cellBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.black,
  },
  approvalDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  totalLabel: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray500,
  },
  totalValue: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray700,
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.black,
    borderRadius: 4,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.red,
  },
  grandLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: COLORS.white,
    textTransform: "uppercase",
  },
  grandValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: COLORS.white,
  },
  empty: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray400,
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
});

function fmtMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export function PdfItemsTable({
  items,
  discount,
  surcharge,
  approvedOnly = false,
  showApprovalStatus = false,
}: Props) {
  const filtered = approvedOnly ? items.filter((i) => i.isApproved === 1) : items;
  const subtotal = filtered.reduce(
    (acc, i) => acc + i.quantity * parseFloat(i.unitSalePrice), 0
  );
  const disc = parseFloat(discount || "0");
  const sur = parseFloat(surcharge || "0");
  const grand = Math.max(0, subtotal - disc + sur);

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Table header */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, s.colSl]}>SL</Text>
        <Text style={[s.thText, s.colDesc]}>Descrição do Item</Text>
        <Text style={[s.thText, s.colPrice]}>Preço Unit.</Text>
        <Text style={[s.thText, s.colUnits]}>Qtd</Text>
        {showApprovalStatus && (
          <Text style={[s.thText, s.colAppr]}>Status</Text>
        )}
        <Text style={[s.thText, s.colTotal]}>Total</Text>
      </View>

      {/* Rows */}
      {filtered.length === 0 ? (
        <Text style={s.empty}>Nenhum item neste documento.</Text>
      ) : (
        filtered.map((item, index) => {
          const name = item.customName || item.partName || item.serviceName || "Item";
          const brand = item.partBrand ? ` (${item.partBrand})` : "";
          const total = item.quantity * parseFloat(item.unitSalePrice);
          const approvalColor =
            item.isApproved === 1 ? COLORS.emerald
            : item.isApproved === -1 ? COLORS.red
            : COLORS.amber;

          return (
            <View key={item.id} style={s.row}>
              <Text style={[s.cellText, s.colSl]}>{index + 1}</Text>
              <View style={s.colDesc}>
                <Text style={s.cellBold}>{name}</Text>
                <Text style={[s.cellText, { fontSize: 7.5, color: COLORS.gray500, marginTop: 1 }]}>
                  {item.type === "SERVICE" ? "Serviço" : `Peça${brand}`}
                </Text>
              </View>
              <Text style={[s.cellText, s.colPrice]}>
                {fmtMoney(parseFloat(item.unitSalePrice))}
              </Text>
              <Text style={[s.cellText, s.colUnits]}>{item.quantity}</Text>
              {showApprovalStatus && (
                <View style={[s.colAppr, { alignItems: "center", justifyContent: "center" }]}>
                  <View style={[s.approvalDot, { backgroundColor: approvalColor }]} />
                </View>
              )}
              <Text style={[s.cellBold, s.colTotal]}>{fmtMoney(total)}</Text>
            </View>
          );
        })
      )}

      {/* Totals */}
      {filtered.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {(disc > 0 || sur > 0) && (
            <>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValue}>{fmtMoney(subtotal)}</Text>
              </View>
              {disc > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Desconto</Text>
                  <Text style={[s.totalValue, { color: COLORS.emerald }]}>
                    - {fmtMoney(disc)}
                  </Text>
                </View>
              )}
              {sur > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Acréscimo</Text>
                  <Text style={s.totalValue}>+ {fmtMoney(sur)}</Text>
                </View>
              )}
            </>
          )}

          {/* Grand total */}
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>Total Geral</Text>
            <Text style={s.grandValue}>{fmtMoney(grand)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
