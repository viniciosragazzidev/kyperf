import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, STATUS_PDF_COLOR, STATUS_PDF_LABEL, sharedStyles } from "./pdf-styles";

interface Customer {
  name: string;
  phone?: string | null;
  document?: string | null;
  email?: string | null;
  address?: string | null;
}

interface Vehicle {
  brand: string;
  model: string;
  plate: string;
  year?: number | null;
  engine?: string | null;
}

interface PdfItem {
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

interface PdfHeaderProps {
  osNumber: number;
  status: string;
  createdAt: Date | string;
  branch: {
    name: string;
    cnpj?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  customer?: Customer | null;
  vehicle?: Vehicle | null;
  items?: PdfItem[];
  discount?: string | null;
  surcharge?: string | null;
  fuelLevel?: string | null;
  currentMileage?: number | null;
  mechanicName?: string | null;
  allocatedBox?: string | null;
}

const s = StyleSheet.create({
  // Logo & Header Top
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 22,
    height: 22,
    backgroundColor: COLORS.emerald,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTextIcon: {
    color: COLORS.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  logoText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: COLORS.black,
    letterSpacing: -0.3,
  },
  logoSubtext: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray500,
  },
  docTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: COLORS.black,
    letterSpacing: -0.5,
    textTransform: "uppercase",
  },

  // Branch Info Box
  branchInfo: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: COLORS.gray500,
    lineHeight: 1.4,
    marginBottom: 12,
  },

  // Layout Grid
  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  leftCol: {
    flex: 1,
    marginRight: 20,
  },
  rightCol: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  // Cards layout
  cardTotal: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 96,
    height: 52,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.emerald,
  },
  cardTotalLabel: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
    textTransform: "uppercase",
    marginBottom: 4,
    textAlign: "center",
  },
  cardTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: COLORS.white,
    textAlign: "center",
  },
  cardLight: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 96,
    height: 52,
    borderWidth: 0.5,
    borderColor: COLORS.gray200,
  },
  cardLightLabel: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray500,
    textTransform: "uppercase",
    marginBottom: 4,
    textAlign: "center",
  },
  cardLightValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.black,
    textAlign: "center",
  },

  // Section Labels & Details (Invoice To)
  sectionLabelSmall: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  clientName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: COLORS.black,
    marginBottom: 3,
  },
  clientDetail: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.gray500,
    marginBottom: 1.5,
    lineHeight: 1.4,
  },
  vehicleModel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: COLORS.black,
    marginBottom: 2,
  },
  vehicleDetail: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray500,
  },
  metaBlock: {
    flexDirection: "row",
    gap: 16,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
  },
  metaItem: {
    flexDirection: "column",
  },
  metaLabel: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
    textTransform: "uppercase",
  },
  metaValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: COLORS.black,
    marginTop: 1,
  },
});

export function PdfHeader({
  osNumber,
  status,
  createdAt,
  branch,
  customer,
  vehicle,
  items,
  discount,
  surcharge,
  fuelLevel,
  currentMileage,
  mechanicName,
  allocatedBox,
}: PdfHeaderProps) {
  const docLabel = STATUS_PDF_LABEL[status] ?? "Documento";
  const dateStr = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Calculate totals if items are provided
  let grandTotal = 0;
  if (items) {
    const approvedOnly = status !== "AWAITING_BUDGET" && status !== "AWAITING_APPROVAL";
    const filtered = approvedOnly ? items.filter((i) => i.isApproved === 1) : items;
    const subtotal = filtered.reduce(
      (acc, i) => acc + i.quantity * parseFloat(i.unitSalePrice), 0
    );
    const disc = parseFloat(discount || "0");
    const sur = parseFloat(surcharge || "0");
    const grand = Math.max(0, subtotal - disc + sur);
    grandTotal = grand;
  }

  function fmtMoney(v: number) {
    return `R$ ${v.toFixed(2).replace(".", ",")}`;
  }

  // Determine Card 1 label & value dynamically
  let card1Label = "Total Devido";
  let card1Value = fmtMoney(grandTotal);

  if (status === "CHECK_IN") {
    card1Label = "Status";
    card1Value = "Check-In";
  } else if (status === "READY" || status === "DELIVERED") {
    card1Label = "Total Pago";
  } else if (status === "AWAITING_BUDGET" || status === "AWAITING_APPROVAL") {
    card1Label = "Total Estimado";
  }

  return (
    <View>
      {/* Top Row: Logo left, Title right */}
      <View style={s.topRow}>
        <View style={s.logoContainer}>
          <View style={s.logoIcon}>
            <Text style={s.logoTextIcon}>K</Text>
          </View>
          <View>
            <Text style={s.logoText}>KYPERFIX</Text>
            <Text style={s.logoSubtext}>SISTEMA DE PÁTIO DE ELITE</Text>
          </View>
        </View>
        <Text style={s.docTitle}>{docLabel}</Text>
      </View>

      {/* Branch info as subtitle detail */}
      <View style={s.branchInfo}>
        <Text>
          {branch?.name ?? "Oficina Automação"} 
          {branch?.cnpj ? ` • CNPJ: ${branch.cnpj}` : ""}
          {branch?.phone ? ` • Tel: ${branch.phone}` : ""}
          {branch?.email ? ` • E-mail: ${branch.email}` : ""}
        </Text>
        {branch?.address && <Text>{branch.address}</Text>}
      </View>

      <View style={sharedStyles.dividerLight} />

      {/* Side-by-side: Customer & Vehicle on Left, Cards on Right */}
      <View style={s.middleRow}>
        {/* Left Column */}
        <View style={s.leftCol}>
          {customer ? (
            <View style={{ marginBottom: 6 }}>
              <Text style={s.sectionLabelSmall}>Faturado Para (Cliente)</Text>
              <Text style={s.clientName}>{customer.name}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {customer.phone && <Text style={s.clientDetail}>Tel: {customer.phone}</Text>}
                {customer.email && <Text style={s.clientDetail}>E-mail: {customer.email}</Text>}
                {customer.document && <Text style={s.clientDetail}>CPF/CNPJ: {customer.document}</Text>}
              </View>
              {customer.address && <Text style={s.clientDetail}>Endereço: {customer.address}</Text>}
            </View>
          ) : (
            <View style={{ marginBottom: 6 }}>
              <Text style={s.sectionLabelSmall}>Cliente</Text>
              <Text style={s.clientName}>Não Informado</Text>
            </View>
          )}

          {vehicle ? (
            <View style={{ marginTop: 4, borderTopWidth: 0.5, borderTopColor: COLORS.gray200, paddingTop: 4 }}>
              <Text style={s.sectionLabelSmall}>Veículo</Text>
              <Text style={s.vehicleModel}>
                {vehicle.brand} {vehicle.model}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 1 }}>
                <Text style={s.vehicleDetail}>Placa: {vehicle.plate}</Text>
                {vehicle.year && <Text style={s.vehicleDetail}>Ano: {vehicle.year}</Text>}
                {currentMileage && <Text style={s.vehicleDetail}>KM: {currentMileage.toLocaleString("pt-BR")}</Text>}
                {fuelLevel && <Text style={s.vehicleDetail}>Combustível: {fuelLevel}</Text>}
              </View>
            </View>
          ) : null}

          {(mechanicName || allocatedBox) ? (
            <View style={s.metaBlock}>
              {mechanicName && (
                <View style={s.metaItem}>
                  <Text style={s.metaLabel}>Responsável Técnico</Text>
                  <Text style={s.metaValue}>{mechanicName}</Text>
                </View>
              )}
              {allocatedBox && (
                <View style={s.metaItem}>
                  <Text style={s.metaLabel}>Box Alocado</Text>
                  <Text style={s.metaValue}>{allocatedBox}</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Right Column (Three Cards) */}
        <View style={s.rightCol}>
          {/* Card 1: Total/Status */}
          <View style={s.cardTotal}>
            <Text style={s.cardTotalLabel}>{card1Label}</Text>
            <Text style={s.cardTotalValue}>{card1Value}</Text>
          </View>

          {/* Card 2: Date */}
          <View style={s.cardLight}>
            <Text style={s.cardLightLabel}>Emissão</Text>
            <Text style={s.cardLightValue}>{dateStr}</Text>
          </View>

          {/* Card 3: OS Number */}
          <View style={s.cardLight}>
            <Text style={s.cardLightLabel}>OS Número</Text>
            <Text style={[s.cardLightValue, { color: COLORS.emerald }]}>
              #{String(osNumber).padStart(5, "0")}
            </Text>
          </View>
        </View>
      </View>

      <View style={sharedStyles.divider} />
    </View>
  );
}
