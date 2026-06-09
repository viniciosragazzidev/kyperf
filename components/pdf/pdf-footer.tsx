import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, sharedStyles } from "./pdf-styles";

interface PdfFooterProps {
  status: string;
  showSignatureLine?: boolean;
  validityDays?: number;
  signatureLabel?: string;
  warrantyText?: string;
}

const s = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  pageNum: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
  },
  validity: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
    fontStyle: "italic",
  },
  signLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray400,
    marginBottom: 4,
    width: "55%",
  },
  signLabel: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  warranty: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLORS.gray600,
    fontStyle: "italic",
    marginBottom: 6,
  },
  autoManagerBrand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: COLORS.gray300,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});

export function PdfFooter({
  status,
  showSignatureLine = false,
  validityDays,
  signatureLabel = "Assinatura do Cliente",
  warrantyText,
}: PdfFooterProps) {
  return (
    <View style={s.footer} fixed>
      {warrantyText && (
        <Text style={s.warranty}>Garantia: {warrantyText}</Text>
      )}

      {showSignatureLine && (
        <View style={{ marginBottom: 10 }}>
          <View style={s.signLine} />
          <Text style={s.signLabel}>{signatureLabel}</Text>
        </View>
      )}

      <View style={sharedStyles.spaceBetween}>
        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
        <View style={{ alignItems: "flex-end" }}>
          {validityDays && (
            <Text style={s.validity}>
              Orçamento válido por {validityDays} dias a partir da data de emissão.
            </Text>
          )}
          <Text style={s.autoManagerBrand}>AutoManager PRO · Sistema de Gestão</Text>
        </View>
      </View>
    </View>
  );
}
