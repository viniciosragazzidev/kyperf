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
  band: {
    height: 6,
    width: "100%",
  },
  headerWrap: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  osNum: {
    fontFamily: "Helvetica-Bold",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  docLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  branchName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLORS.gray800,
    marginBottom: 1,
  },
  branchDetail: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLORS.gray500,
    marginBottom: 1,
  },
  emissionLabel: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  emissionDate: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.gray700,
    marginTop: 1,
  },
});

export function PdfHeader({ osNumber, status, createdAt, branch }: PdfHeaderProps) {
  const accentColor = STATUS_PDF_COLOR[status] ?? COLORS.gray500;
  const docLabel = STATUS_PDF_LABEL[status] ?? "DOCUMENTO";
  const dateStr = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Top accent band */}
      <View style={[s.band, { backgroundColor: accentColor }]} />

      <View style={s.headerWrap}>
        <View style={sharedStyles.spaceBetween}>
          {/* Left: OS number + doc type */}
          <View>
            <Text style={[s.osNum, { color: accentColor }]}>
              OS #{String(osNumber).padStart(4, "0")}
            </Text>
            <Text style={[s.docLabel, { color: accentColor }]}>{docLabel}</Text>
          </View>

          {/* Right: branch info */}
          <View style={{ alignItems: "flex-end" }}>
            {branch ? (
              <>
                <Text style={s.branchName}>{branch.name}</Text>
                {branch.cnpj && (
                  <Text style={s.branchDetail}>CNPJ: {branch.cnpj}</Text>
                )}
                {branch.phone && (
                  <Text style={s.branchDetail}>{branch.phone}</Text>
                )}
                {branch.email && (
                  <Text style={s.branchDetail}>{branch.email}</Text>
                )}
                {branch.address && (
                  <Text style={s.branchDetail}>{branch.address}</Text>
                )}
              </>
            ) : (
              <Text style={s.branchName}>Oficina AutoManager</Text>
            )}
          </View>
        </View>

        {/* Emission date row */}
        <View style={[sharedStyles.spaceBetween, { marginTop: 10 }]}>
          <View>
            <Text style={s.emissionLabel}>Data de Emissão</Text>
            <Text style={s.emissionDate}>{dateStr}</Text>
          </View>
          {/* Accent right line */}
          <View
            style={{
              height: 28,
              width: 4,
              backgroundColor: accentColor,
              borderRadius: 2,
              opacity: 0.25,
            }}
          />
        </View>
      </View>
    </>
  );
}
