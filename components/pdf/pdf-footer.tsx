import { View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { COLORS, sharedStyles } from "./pdf-styles";

interface PdfFooterProps {
  showSignatureLine?: boolean;
  signatureLabel?: string;
  validityDays?: number;
  noteText?: string;
  paymentMethod?: string | null;
  branch?: {
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
  qrCodeUrl?: string | null;
  budgetAccessCode?: string | null;
}

const s = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
  },
  noteBox: {
    borderWidth: 0.5,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    backgroundColor: COLORS.gray50,
  },
  noteText: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLORS.gray500,
    lineHeight: 1.4,
  },
  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  paymentCol: {
    flex: 1.1,
    marginRight: 20,
  },
  qrCol: {
    flex: 0.8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 15,
  },
  qrTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: COLORS.black,
    textTransform: "uppercase",
    marginBottom: 3,
    textAlign: "center",
  },
  qrImage: {
    width: 48,
    height: 48,
    marginBottom: 3,
  },
  qrText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    color: COLORS.gray700,
    textAlign: "center",
  },
  signCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sectionLabelSmall: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: COLORS.black,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  paymentText: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLORS.gray500,
    marginBottom: 6,
    lineHeight: 1.3,
  },
  termsText: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: COLORS.gray400,
    lineHeight: 1.3,
  },
  signLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray400,
    width: "100%",
    marginBottom: 4,
  },
  signLabel: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLORS.gray500,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
    paddingTop: 6,
  },
  contactText: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
  },
  pageNum: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
  },
});

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  Pix: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  BANK_TRANSFER: "Transferência Bancária",
};

export function PdfFooter({
  showSignatureLine = false,
  signatureLabel = "Assinatura do Cliente",
  validityDays,
  noteText,
  paymentMethod,
  branch,
  qrCodeUrl,
  budgetAccessCode,
}: PdfFooterProps) {
  const payLabel = paymentMethod ? (PAYMENT_LABELS[paymentMethod] || paymentMethod) : null;

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

      {/* Middle row: Payment info left + QR Code center + signature right */}
      <View style={s.middleRow}>
        {/* Left side: Payment Info & Terms */}
        <View style={s.paymentCol}>
          <Text style={s.sectionLabelSmall}>Forma de Pagamento</Text>
          <Text style={s.paymentText}>
            {payLabel 
              ? `Efetuar pagamento via ${payLabel}. Se necessário, solicite as chaves ou dados de faturamento.`
              : "PIX (Chave CNPJ da Oficina), Cartões de Débito ou Crédito."}
          </Text>
          <Text style={s.sectionLabelSmall}>Termos & Condições</Text>
          <Text style={s.termsText}>
            Garantia legal de 90 dias sobre serviços e peças aplicadas. Veículos não retirados em até 48h após conclusão estão sujeitos a cobrança de permanência.
          </Text>
        </View>

        {/* Center side: QR Code */}
        {qrCodeUrl ? (
          <View style={s.qrCol}>
            <Text style={s.qrTitle}>Versão Online</Text>
            <Image src={qrCodeUrl} style={s.qrImage} />
            {budgetAccessCode && (
              <Text style={s.qrText}>CÓDIGO: {budgetAccessCode}</Text>
            )}
          </View>
        ) : null}

        {/* Right side: Signature */}
        <View style={s.signCol}>
          {showSignatureLine && (
            <View style={{ width: "100%", alignItems: "center" }}>
              <View style={s.signLine} />
              <Text style={s.signLabel}>{signatureLabel}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Contact info bar + Page number */}
      <View style={s.contactRow}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {branch?.phone && <Text style={s.contactText}>Tel: {branch.phone}</Text>}
          {branch?.email && <Text style={s.contactText}>E-mail: {branch.email}</Text>}
          {branch?.address && <Text style={s.contactText}>End: {branch.address}</Text>}
        </View>
        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </View>
    </View>
  );
}
