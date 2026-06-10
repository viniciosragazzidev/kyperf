import { StyleSheet } from "@react-pdf/renderer";

export const COLORS = {
  black:     "#121214",
  dark:      "#1E1E24",
  gray700:   "#3F3F46",
  gray500:   "#71717A",
  gray400:   "#A1A1AA",
  gray200:   "#E4E4E7",
  gray100:   "#F4F4F5",
  gray50:    "#FAFAFA",
  white:     "#FFFFFF",

  // Status accent colours (kept for header accent stripe)
  blue:      "#2563EB",
  amber:     "#D97706",
  indigo:    "#4F46E5",
  pink:      "#DB2777",
  emerald:   "#059669",
  red:       "#E50914", // KyperFix brand red
};

// ─── Status → accent colour ────────────────────────────────────────────────────
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
  CHECK_IN:           "Ficha de Check-in",
  AWAITING_BUDGET:    "Orçamento",
  AWAITING_APPROVAL:  "Orçamento",
  AWAITING_PARTS:     "Ordem de Serviço",
  IN_PROGRESS:        "Ordem de Serviço",
  TESTING_WASHING:    "Nota de Conclusão",
  READY:              "Nota de Conclusão",
  DELIVERED:          "Nota de Entrega",
};

// ─── Shared Styles ─────────────────────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.white,
    fontFamily: "Helvetica",
    paddingTop: 48,
    paddingBottom: 72,
    paddingHorizontal: 48,
  },

  // ── Typography ──────────────────────────────────────────────────────────────
  docTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 28,
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  docNumber: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 4,
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: COLORS.black,
    letterSpacing: -0.3,
    textAlign: "right",
  },
  sectionLabel: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  fieldBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: COLORS.black,
    marginBottom: 2,
  },
  fieldRegular: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.gray500,
    marginBottom: 1.5,
    lineHeight: 1.5,
  },
  metaValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.black,
  },

  // ── Layout ──────────────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
  },
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  flex1: { flex: 1 },

  // ── Dividers ─────────────────────────────────────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    marginVertical: 16,
  },
  dividerLight: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
    marginVertical: 10,
  },
});
