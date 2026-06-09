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
  accentColor?: string;
}

const s = StyleSheet.create({
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  col: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: 6,
    padding: 12,
  },
  fieldLabel: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  fieldValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.gray800,
    marginBottom: 6,
  },
  fieldValueSm: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray700,
    marginBottom: 5,
  },
  plateBadge: {
    backgroundColor: COLORS.gray800,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  plateText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLORS.white,
    letterSpacing: 2,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
  },
  metaItem: {
    flex: 1,
  },
  mechBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
});

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ marginBottom: 5 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValueSm}>{value}</Text>
    </View>
  );
}

export function PdfClientVehicleBlock({
  customer,
  vehicle,
  fuelLevel,
  currentMileage,
  mechanicName,
  allocatedBox,
  accentColor = COLORS.emerald,
}: Props) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={[sharedStyles.row, { gap: 12 }]}>
        {/* ── Cliente ── */}
        <View style={s.col}>
          <Text style={s.sectionTitle}>Proprietário / Cliente</Text>
          {customer ? (
            <>
              <Text style={s.fieldValue}>{customer.name}</Text>
              <Field label="Telefone" value={customer.phone} />
              <Field label="CPF / CNPJ" value={customer.document} />
              <Field label="E-mail" value={customer.email} />
              <Field label="Endereço" value={customer.address} />
            </>
          ) : (
            <Text style={s.fieldValueSm}>Não informado</Text>
          )}
        </View>

        {/* ── Veículo ── */}
        <View style={s.col}>
          <Text style={s.sectionTitle}>Veículo</Text>
          {vehicle ? (
            <>
              <View style={s.plateBadge}>
                <Text style={s.plateText}>{vehicle.plate}</Text>
              </View>
              <Text style={s.fieldValue}>
                {vehicle.brand} {vehicle.model}
              </Text>
              <Field label="Ano" value={vehicle.year ? String(vehicle.year) : null} />
              <Field label="Motor" value={vehicle.engine} />
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <Text style={s.fieldLabel}>Km Atual</Text>
                  <Text style={s.fieldValueSm}>
                    {currentMileage
                      ? `${currentMileage.toLocaleString("pt-BR")} km`
                      : "—"}
                  </Text>
                </View>
                {fuelLevel && (
                  <View style={s.metaItem}>
                    <Text style={s.fieldLabel}>Combustível</Text>
                    <Text style={s.fieldValueSm}>{fuelLevel}</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <Text style={s.fieldValueSm}>Não informado</Text>
          )}
        </View>
      </View>

      {/* ── Mecânico / Box ── */}
      {(mechanicName || allocatedBox) && (
        <View
          style={[
            sharedStyles.row,
            {
              marginTop: 8,
              gap: 12,
              backgroundColor: COLORS.gray50,
              borderRadius: 6,
              padding: 10,
            },
          ]}
        >
          {mechanicName && (
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Mecânico Responsável</Text>
              <View
                style={[
                  s.mechBadge,
                  { backgroundColor: accentColor + "22" },
                ]}
              >
                <Text
                  style={[
                    s.fieldValueSm,
                    { color: accentColor, marginBottom: 0, fontFamily: "Helvetica-Bold" },
                  ]}
                >
                  {mechanicName}
                </Text>
              </View>
            </View>
          )}
          {allocatedBox && (
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Box Alocado</Text>
              <Text style={[s.fieldValueSm, { fontFamily: "Helvetica-Bold" }]}>
                {allocatedBox}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
