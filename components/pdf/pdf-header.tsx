import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, STATUS_PDF_COLOR, STATUS_PDF_LABEL, sharedStyles } from "./pdf-styles";

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
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 32,
    marginTop: 4,
  },
  metaBlock: {
    alignItems: "flex-end",
  },
  accentBar: {
    height: 3,
    borderRadius: 1.5,
    marginBottom: 20,
  },
});

export function PdfHeader({ osNumber, status, createdAt, branch }: PdfHeaderProps) {
  const accentColor = STATUS_PDF_COLOR[status] ?? COLORS.blue;
  const docLabel = STATUS_PDF_LABEL[status] ?? "Documento";
  const dateStr = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <View>
      {/* Thin accent bar at top */}
      <View style={[s.accentBar, { backgroundColor: accentColor }]} />

      {/* Title row: Doc name left, company right */}
      <View style={s.headerRow}>
        <View>
          <Text style={sharedStyles.docTitle}>{docLabel}</Text>
          <Text style={sharedStyles.docNumber}>
            #{String(osNumber).padStart(5, "0")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={sharedStyles.companyName}>
            {branch?.name ?? "KyperFix"}
          </Text>
        </View>
      </View>

      <View style={sharedStyles.divider} />

      {/* Meta row: dates + branch info */}
      <View style={sharedStyles.spaceBetween}>
        {/* Left: branch details */}
        <View style={{ maxWidth: "55%" }}>
          {branch?.cnpj && (
            <Text style={sharedStyles.fieldRegular}>CNPJ: {branch.cnpj}</Text>
          )}
          {branch?.address && (
            <Text style={sharedStyles.fieldRegular}>{branch.address}</Text>
          )}
          {branch?.phone && (
            <Text style={sharedStyles.fieldRegular}>{branch.phone}</Text>
          )}
          {branch?.email && (
            <Text style={sharedStyles.fieldRegular}>{branch.email}</Text>
          )}
        </View>

        {/* Right: dates */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={sharedStyles.sectionLabel}>Data de Emissão</Text>
            <Text style={sharedStyles.metaValue}>{dateStr}</Text>
          </View>
        </View>
      </View>

      <View style={sharedStyles.divider} />
    </View>
  );
}
