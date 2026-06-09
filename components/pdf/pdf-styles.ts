import { StyleSheet } from "@react-pdf/renderer";

// ─── Color Palette ───────────────────────────────────────────────────────────
export const COLORS = {
  // Brand
  emerald:     "#10B981",
  emeraldDark: "#059669",
  blue:        "#3B82F6",
  amber:       "#F59E0B",
  indigo:      "#6366F1",
  pink:        "#EC4899",
  red:         "#EF4444",
  // Neutrals
  white:       "#FFFFFF",
  gray50:      "#F9FAFB",
  gray100:     "#F3F4F6",
  gray200:     "#E5E7EB",
  gray300:     "#D1D5DB",
  gray400:     "#9CA3AF",
  gray500:     "#6B7280",
  gray600:     "#4B5563",
  gray700:     "#374151",
  gray800:     "#1F2937",
  gray900:     "#111827",
};

// ─── Status → document colour mapping ────────────────────────────────────────
export const STATUS_PDF_COLOR: Record<string, string> = {
  CHECK_IN:           COLORS.blue,
  AWAITING_BUDGET:    COLORS.amber,
  AWAITING_APPROVAL:  COLORS.amber,
  AWAITING_PARTS:     COLORS.indigo,
  IN_PROGRESS:        COLORS.indigo,
  TESTING_WASHING:    COLORS.pink,
  READY:              COLORS.emerald,
  DELIVERED:          COLORS.emerald,
};

export const STATUS_PDF_LABEL: Record<string, string> = {
  CHECK_IN:           "FICHA DE CHECK-IN",
  AWAITING_BUDGET:    "ORÇAMENTO DETALHADO",
  AWAITING_APPROVAL:  "ORÇAMENTO — AGUARDANDO APROVAÇÃO",
  AWAITING_PARTS:     "ORDEM DE SERVIÇO INTERNA",
  IN_PROGRESS:        "ORDEM DE SERVIÇO INTERNA",
  TESTING_WASHING:    "NOTA DE CONCLUSÃO",
  READY:              "NOTA DE CONCLUSÃO",
  DELIVERED:          "NOTA DE ENTREGA",
};

// ─── Shared Styles ────────────────────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.white,
    fontFamily: "Helvetica",
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 0,
  },
  // Page background accent strip (top)
  headerBand: {
    height: 8,
    width: "100%",
  },
  // White content area with side padding
  body: {
    paddingHorizontal: 40,
    paddingTop: 20,
    flex: 1,
  },
  // ── Typography ──────────────────────────────────────
  h1: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  h2: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: COLORS.gray800,
    marginBottom: 6,
  },
  h3: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.gray700,
    marginBottom: 4,
  },
  label: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  value: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray800,
  },
  valueBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.gray900,
  },
  small: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  // ── Layout ────────────────────────────────────────
  row: {
    flexDirection: "row",
  },
  col: {
    flexDirection: "column",
  },
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flex1: { flex: 1 },
  // ── Divider ───────────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    marginVertical: 12,
  },
  dividerLight: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
    marginVertical: 8,
  },
  // ── Section card ─────────────────────────────────
  card: {
    backgroundColor: COLORS.gray50,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  cardBordered: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: 12,
    marginBottom: 12,
  },
  // ── Badge ─────────────────────────────────────────
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // ── Signature line ────────────────────────────────
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray400,
    marginTop: 24,
    marginBottom: 4,
    width: "60%",
  },
});
