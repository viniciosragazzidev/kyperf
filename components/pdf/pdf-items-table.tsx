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
  accentColor?: string;
  /** If true, only show approved items */
  approvedOnly?: boolean;
  /** If true, show approval status badges */
  showApprovalStatus?: boolean;
}

const s = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.gray800,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 2,
  },
  colType:  { width: 50 },
  colDesc:  { flex: 1 },
  colQty:   { width: 36, textAlign: "center" },
  colUnit:  { width: 60, textAlign: "right" },
  colTotal: { width: 64, textAlign: "right" },
  thText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 3,
    alignItems: "center",
  },
  rowEven: { backgroundColor: COLORS.gray50 },
  rowOdd:  { backgroundColor: COLORS.white },
  cellText: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.gray800,
  },
  cellTextBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: COLORS.gray900,
  },
  typeBadge: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  groupLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
    paddingLeft: 8,
  },
  totalsWrap: {
    marginTop: 10,
    borderRadius: 6,
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: COLORS.gray50,
  },
  totalsLabel: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.gray600,
  },
  totalsValue: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.gray700,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  grandTotalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLORS.gray900,
  },
  grandTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
  },
  approvedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
});

function fmtMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function ItemRow({
  item,
  idx,
  accentColor,
  showApprovalStatus,
}: {
  item: PdfItem;
  idx: number;
  accentColor: string;
  showApprovalStatus?: boolean;
}) {
  const name =
    item.customName ||
    item.partName ||
    item.serviceName ||
    "Item sem nome";
  const brand = item.partBrand ? ` (${item.partBrand})` : "";
  const total = item.quantity * parseFloat(item.unitSalePrice);
  const isService = item.type === "SERVICE";
  const isEven = idx % 2 === 0;

  const badgeColor = isService
    ? { bg: "#E0E7FF", text: "#4338CA" }
    : { bg: "#D1FAE5", text: "#065F46" };

  const approvalColor =
    item.isApproved === 1
      ? COLORS.emerald
      : item.isApproved === -1
      ? COLORS.red
      : COLORS.amber;

  return (
    <View style={[s.row, isEven ? s.rowEven : s.rowOdd]}>
      {/* Type badge */}
      <View style={s.colType}>
        <View style={[s.typeBadge, { backgroundColor: badgeColor.bg }]}>
          <Text style={[s.badgeText, { color: badgeColor.text }]}>
            {isService ? "Serviço" : "Peça"}
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={s.colDesc}>
        <Text style={s.cellTextBold}>
          {name}
          {brand}
        </Text>
      </View>

      {/* Qty */}
      <Text style={[s.colQty, s.cellText]}>{item.quantity}</Text>

      {/* Unit */}
      <Text style={[s.colUnit, s.cellText]}>
        {fmtMoney(parseFloat(item.unitSalePrice))}
      </Text>

      {/* Total */}
      <View style={[s.colTotal, { flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }]}>
        <Text style={[s.cellTextBold, { color: accentColor }]}>
          {fmtMoney(total)}
        </Text>
        {showApprovalStatus && (
          <View
            style={[s.approvedDot, { backgroundColor: approvalColor }]}
          />
        )}
      </View>
    </View>
  );
}

export function PdfItemsTable({
  items,
  discount,
  surcharge,
  accentColor = COLORS.emerald,
  approvedOnly = false,
  showApprovalStatus = false,
}: Props) {
  const filtered = approvedOnly ? items.filter((i) => i.isApproved === 1) : items;
  const parts    = filtered.filter((i) => i.type === "PART");
  const services = filtered.filter((i) => i.type === "SERVICE");

  const subtotal = filtered.reduce(
    (acc, i) => acc + i.quantity * parseFloat(i.unitSalePrice),
    0
  );
  const disc = parseFloat(discount || "0");
  const sur  = parseFloat(surcharge || "0");
  const grand = Math.max(0, subtotal - disc + sur);

  let globalIdx = 0;

  return (
    <View>
      {/* Table header */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, s.colType]}>Tipo</Text>
        <Text style={[s.thText, s.colDesc]}>Descrição</Text>
        <Text style={[s.thText, { ...s.colQty }]}>Qtd</Text>
        <Text style={[s.thText, { ...s.colUnit }]}>Unit.</Text>
        <Text style={[s.thText, { ...s.colTotal }]}>Total</Text>
      </View>

      {/* Services group */}
      {services.length > 0 && (
        <>
          <Text style={s.groupLabel}>— Serviços</Text>
          {services.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              idx={globalIdx++}
              accentColor={accentColor}
              showApprovalStatus={showApprovalStatus}
            />
          ))}
        </>
      )}

      {/* Parts group */}
      {parts.length > 0 && (
        <>
          <Text style={s.groupLabel}>— Peças / Materiais</Text>
          {parts.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              idx={globalIdx++}
              accentColor={accentColor}
              showApprovalStatus={showApprovalStatus}
            />
          ))}
        </>
      )}

      {filtered.length === 0 && (
        <Text
          style={{
            fontSize: 8,
            color: COLORS.gray400,
            textAlign: "center",
            paddingVertical: 16,
            fontStyle: "italic",
          }}
        >
          Nenhum item cadastrado nesta O.S.
        </Text>
      )}

      {/* Totals */}
      <View style={[s.totalsWrap, { borderWidth: 1, borderColor: COLORS.gray200 }]}>
        <View style={s.totalsRow}>
          <Text style={s.totalsLabel}>Subtotal</Text>
          <Text style={s.totalsValue}>{fmtMoney(subtotal)}</Text>
        </View>
        {disc > 0 && (
          <View style={[s.totalsRow, { backgroundColor: "#FEF3C7" }]}>
            <Text style={[s.totalsLabel, { color: "#92400E" }]}>Desconto</Text>
            <Text style={[s.totalsValue, { color: "#92400E" }]}>
              - {fmtMoney(disc)}
            </Text>
          </View>
        )}
        {sur > 0 && (
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Acréscimo</Text>
            <Text style={s.totalsValue}>+ {fmtMoney(sur)}</Text>
          </View>
        )}
        <View
          style={[
            s.grandTotalRow,
            { backgroundColor: accentColor + "18" },
          ]}
        >
          <Text style={s.grandTotalLabel}>TOTAL</Text>
          <Text style={[s.grandTotalValue, { color: accentColor }]}>
            {fmtMoney(grand)}
          </Text>
        </View>
      </View>
    </View>
  );
}
