import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, sharedStyles } from "./pdf-styles";

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
  mileage?: number | null;
}

interface Props {
  customer: Customer | null;
  vehicle: Vehicle | null;
  fuelLevel?: string | null;
  currentMileage?: number;
  mechanicName?: string | null;
  allocatedBox?: string | null;
}

const s = StyleSheet.create({
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 40,
  },
  col: {
    flex: 1,
  },
  nameText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.black,
    marginBottom: 3,
  },
  infoText: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray500,
    marginBottom: 1.5,
    lineHeight: 1.5,
  },
  plateBadge: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLORS.black,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  vehicleModel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.black,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
  },
  metaBlock: {},
});

export function PdfClientVehicleBlock({
  customer,
  vehicle,
  fuelLevel,
  currentMileage,
  mechanicName,
  allocatedBox,
}: Props) {
  return (
    <View style={{ marginBottom: 8 }}>
      {/* Two-column: De (From) / Para (To - vehicle) */}
      <View style={s.twoCol}>
        {/* Client */}
        <View style={s.col}>
          <Text style={sharedStyles.sectionLabel}>Cliente</Text>
          {customer ? (
            <>
              <Text style={s.nameText}>{customer.name}</Text>
              {customer.address && <Text style={s.infoText}>{customer.address}</Text>}
              {customer.document && <Text style={s.infoText}>CPF/CNPJ: {customer.document}</Text>}
              {customer.email && <Text style={s.infoText}>{customer.email}</Text>}
              {customer.phone && <Text style={s.infoText}>{customer.phone}</Text>}
            </>
          ) : (
            <Text style={s.infoText}>Não informado</Text>
          )}
        </View>

        {/* Vehicle */}
        <View style={[s.col, { alignItems: "flex-end" }]}>
          <Text style={[sharedStyles.sectionLabel, { textAlign: "right" }]}>Veículo</Text>
          {vehicle ? (
            <>
              <Text style={[s.plateBadge, { textAlign: "right" }]}>{vehicle.plate}</Text>
              <Text style={[s.vehicleModel, { textAlign: "right" }]}>
                {vehicle.brand} {vehicle.model}
              </Text>
              {vehicle.year && (
                <Text style={[s.infoText, { textAlign: "right" }]}>Ano: {vehicle.year}</Text>
              )}
              {vehicle.engine && (
                <Text style={[s.infoText, { textAlign: "right" }]}>{vehicle.engine}</Text>
              )}
              {currentMileage ? (
                <Text style={[s.infoText, { textAlign: "right" }]}>
                  {currentMileage.toLocaleString("pt-BR")} km
                </Text>
              ) : null}
              {fuelLevel && (
                <Text style={[s.infoText, { textAlign: "right" }]}>
                  Combustível: {fuelLevel}
                </Text>
              )}
            </>
          ) : (
            <Text style={[s.infoText, { textAlign: "right" }]}>Não informado</Text>
          )}
        </View>
      </View>

      {/* Mechanic / Box meta row */}
      {(mechanicName || allocatedBox) && (
        <View style={s.metaRow}>
          {mechanicName && (
            <View style={s.metaBlock}>
              <Text style={sharedStyles.sectionLabel}>Mecânico</Text>
              <Text style={sharedStyles.metaValue}>{mechanicName}</Text>
            </View>
          )}
          {allocatedBox && (
            <View style={s.metaBlock}>
              <Text style={sharedStyles.sectionLabel}>Box</Text>
              <Text style={sharedStyles.metaValue}>{allocatedBox}</Text>
            </View>
          )}
        </View>
      )}

      <View style={sharedStyles.divider} />
    </View>
  );
}
