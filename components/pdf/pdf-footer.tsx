import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, sharedStyles } from "./pdf-styles";

interface PdfFooterProps {
  showSignatureLine?: boolean;
  signatureLabel?: string;
  validityDays?: number;
  noteText?: string;
}

const s = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 48,
    paddingBottom: 28,
    paddingTop: 12,
  },
  noteBox: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  noteText: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray500,
    lineHeight: 1.6,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signCol: {
    alignItems: "flex-end",
    width: "45%",
  },
  signLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray400,
    width: "100%",
    marginBottom: 4,
  },
  signLabel: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray400,
  },
  signName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.dark,
    marginBottom: 2,
  },
  signNote: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
    fontStyle: "italic",
    marginTop: 2,
  },
  pageNum: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
  },
  brand: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray200,
  },
});

export function PdfFooter({
  showSignatureLine = false,
  signatureLabel = "Assinatura do Cliente",
  validityDays,
  noteText,
}: PdfFooterProps) {
  return (
    <View style={s.footer} fixed>
      {/* Note box */}
      {(noteText || validityDays) && (
        <View style={s.noteBox}>
          <Text style={s.noteText}>
            {noteText
              ? noteText
              : `Nota: Este orçamento possui validade de ${validityDays} dias a partir da data de emissão. Após esse período, os valores estão sujeitos a alteração.`}
          </Text>
        </View>
      )}

      {/* Bottom row: payment info left + signature right */}
      <View style={s.bottomRow}>
        {/* Page numbers */}
        <View>
          <Text
            style={s.pageNum}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
            fixed
          />
          <Text style={s.brand}>KyperFix</Text>
        </View>

        {/* Signature area */}
        {showSignatureLine && (
          <View style={s.signCol}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>{signatureLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
