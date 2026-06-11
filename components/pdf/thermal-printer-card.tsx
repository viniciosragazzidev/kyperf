"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDownloadLink, PDFViewer, type DocumentProps } from "@react-pdf/renderer";
import { Printer, Download, Scissors, Eye, X, Loader2 } from "lucide-react";
import { getWorkOrderForPdfAction } from "@/lib/actions/pdf-actions";
import { CheckInPDF } from "./documents/checkin-pdf";
import { BudgetPDF } from "./documents/budget-pdf";
import { WorkOrderPDF } from "./documents/workorder-pdf";
import { ConclusionPDF } from "./documents/conclusion-pdf";
import { DeliveryPDF } from "./documents/delivery-pdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_DOC_LABELS: Record<string, string> = {
  CHECK_IN: "Ficha de Check-in",
  AWAITING_BUDGET: "Orçamento",
  AWAITING_APPROVAL: "Orçamento",
  AWAITING_PARTS: "O.S. Interna",
  IN_PROGRESS: "O.S. Interna",
  TESTING_WASHING: "Nota de Conclusão",
  READY: "Nota de Conclusão",
  DELIVERED: "Nota de Entrega",
};

const STATUS_ACCENT: Record<string, string> = {
  CHECK_IN: "#3B82F6",
  AWAITING_BUDGET: "#F59E0B",
  AWAITING_APPROVAL: "#F59E0B",
  AWAITING_PARTS: "#6366F1",
  IN_PROGRESS: "#6366F1",
  TESTING_WASHING: "#EC4899",
  READY: "#10B981",
  DELIVERED: "#10B981",
};

const STATUS_FILE_SUFFIX: Record<string, string> = {
  CHECK_IN: "checkin",
  AWAITING_BUDGET: "orcamento",
  AWAITING_APPROVAL: "orcamento",
  AWAITING_PARTS: "os",
  IN_PROGRESS: "os",
  TESTING_WASHING: "conclusao",
  READY: "conclusao",
  DELIVERED: "entrega",
};

// ─── Receipt lines builder ─────────────────────────────────────────────────────
function buildReceiptLines(order: any): string[] {
  const lines: string[] = [];
  const branch = order.branch;
  lines.push(branch?.name?.toUpperCase() ?? "OFICINA KYPERFIX");
  if (branch?.cnpj) lines.push(`CNPJ: ${branch.cnpj}`);
  if (branch?.address) lines.push(branch.address);
  lines.push("─────────────────────────────");
  lines.push(`OS #${String(order.osNumber).padStart(4, "0")}`);
  lines.push(
    new Date(order.createdAt).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  );
  lines.push("─────────────────────────────");
  if (order.customer?.name) lines.push(`Cliente: ${order.customer.name}`);
  if (order.vehicle) {
    lines.push(`Veículo: ${order.vehicle.brand} ${order.vehicle.model}`);
    lines.push(`Placa: ${order.vehicle.plate}`);
  }
  if (order.items?.length > 0) {
    lines.push("─────────────────────────────");
    lines.push("ITENS:");
    order.items.slice(0, 6).forEach((item: any) => {
      const name = item.customName || item.partName || item.serviceName || "Item";
      const total = (item.quantity * parseFloat(item.unitSalePrice)).toFixed(2);
      const truncated = name.length > 16 ? name.slice(0, 16) + "…" : name;
      lines.push(`${truncated} x${item.quantity}`);
      lines.push(`  R$ ${total.replace(".", ",")}`);
    });
    if (order.items.length > 6) lines.push(`  + ${order.items.length - 6} item(s)...`);
    lines.push("─────────────────────────────");
    const subtotal = order.items.reduce(
      (a: number, i: any) => a + i.quantity * parseFloat(i.unitSalePrice), 0
    );
    lines.push(`TOTAL  R$ ${subtotal.toFixed(2).replace(".", ",")}`);
  }
  lines.push("─────────────────────────────");
  lines.push("OBRIGADO PELA PREFERÊNCIA!");
  lines.push("KyperFix - Sistema de Gestão para Oficinas");
  return lines;
}

// ─── PDF document resolver ─────────────────────────────────────────────────────
function resolvePDFDocument(status: string, orderData: any): React.ReactElement<DocumentProps> {
  if (status === "CHECK_IN")
    return <CheckInPDF order={orderData} /> as React.ReactElement<DocumentProps>;
  if (status === "AWAITING_BUDGET" || status === "AWAITING_APPROVAL")
    return <BudgetPDF order={orderData} /> as React.ReactElement<DocumentProps>;
  if (status === "IN_PROGRESS" || status === "AWAITING_PARTS")
    return <WorkOrderPDF order={orderData} /> as React.ReactElement<DocumentProps>;
  if (status === "TESTING_WASHING" || status === "READY")
    return <ConclusionPDF order={orderData} /> as React.ReactElement<DocumentProps>;
  if (status === "DELIVERED")
    return <DeliveryPDF order={orderData} /> as React.ReactElement<DocumentProps>;
  return <BudgetPDF order={orderData} /> as React.ReactElement<DocumentProps>;
}

// ─── PDF Preview Modal ─────────────────────────────────────────────────────────
function PDFPreviewModal({
  doc,
  fileName,
  onClose,
  accent,
  docLabel,
}: {
  doc: React.ReactElement<DocumentProps>;
  fileName: string;
  onClose: () => void;
  accent: string;
  docLabel: string;
}) {
  return (
    <AnimatePresence>
      <motion.div
        key="pdf-preview-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/80 flex flex-col"
        style={{ backdropFilter: "blur(4px)" }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-1.5" style={{ background: accent + "33" }}>
              <Printer size={15} style={{ color: accent }} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{docLabel}</p>
              <p className="text-[10px] text-white/50">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download button */}
            <PDFDownloadLink document={doc} fileName={fileName}>
              {({ loading, url }) => (
                <button
                  disabled={loading || !url}
                  className="flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-4 py-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: accent, color: "#fff" }}
                >
                  <Download size={13} />
                  {loading ? "Preparando…" : "Baixar PDF"}
                </button>
              )}
            </PDFDownloadLink>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 min-h-0">
          <PDFViewer width="100%" height="100%" showToolbar>
            {doc}
          </PDFViewer>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Thermal Printer Card ──────────────────────────────────────────────────────
type PrintState = "idle" | "loading" | "printing" | "done";

export function ThermalPrinterCard({
  orderId,
  osNumber,
  status,
  noAnimation = false,
}: {
  orderId: string;
  osNumber: number;
  status: string;
  noAnimation?: boolean;
}) {
  const [printState, setPrintState] = useState<PrintState>("idle");
  const [orderData, setOrderData] = useState<any>(null);
  const [receiptLines, setReceiptLines] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState(0);
  const [printProgress, setPrintProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const accent = STATUS_ACCENT[status] ?? "#10B981";
  const docLabel = STATUS_DOC_LABELS[status] ?? "Documento";
  const fileSuffix = STATUS_FILE_SUFFIX[status] ?? "os";
  const fileName = `OS-${String(osNumber).padStart(4, "0")}-${fileSuffix}.pdf`;
  const doc = orderData ? resolvePDFDocument(status, orderData) : null;

  useEffect(() => {
    if (noAnimation) {
      const fetchAndSet = async () => {
        setPrintState("loading");
        try {
          const result = await getWorkOrderForPdfAction(orderId);
          if (result.success && result.data) {
            setOrderData(result.data);
            setPrintState("done");
          } else {
            setError(result.error ?? "Erro ao carregar dados.");
            setPrintState("idle");
          }
        } catch (err: any) {
          setError(err.message ?? "Erro ao carregar dados.");
          setPrintState("idle");
        }
      };
      fetchAndSet();
    }
  }, [noAnimation, orderId]);

  // ── Start animation ──────────────────────────────────────────────────────
  const startPrint = useCallback(async () => {
    if (printState !== "idle") return;
    setPrintState("loading");
    setError(null);

    try {
      const result = await getWorkOrderForPdfAction(orderId);
      if (!result.success || !result.data)
        throw new Error(result.error ?? "Erro ao carregar dados da OS.");

      const data = result.data;
      setOrderData(data);

      const lines = buildReceiptLines(data);
      setReceiptLines(lines);
      setVisibleLines(0);
      setPrintProgress(0);
      setPrintState("printing");

      let lineIdx = 0;
      const interval = setInterval(() => {
        lineIdx++;
        setVisibleLines(lineIdx);
        setPrintProgress(Math.round((lineIdx / lines.length) * 100));
        if (lineIdx >= lines.length) {
          clearInterval(interval);
          setTimeout(() => setPrintState("done"), 400);
        }
      }, 75);
    } catch (err: any) {
      setError(err.message ?? "Erro desconhecido.");
      setPrintState("idle");
    }
  }, [orderId, printState]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const tearOff = useCallback(() => {
    setPrintState("idle");
    setOrderData(null);
    setReceiptLines([]);
    setVisibleLines(0);
    setPrintProgress(0);
    setError(null);
    setShowPreview(false);
  }, []);

  return (
    <>
      {/* PDF preview fullscreen modal */}
      {showPreview && doc && (
        <PDFPreviewModal
          doc={doc}
          fileName={fileName}
          onClose={() => setShowPreview(false)}
          accent={accent}
          docLabel={docLabel}
        />
      )}

      {noAnimation ? (
        <div className="w-full flex flex-col gap-3" style={{ width: 272 }}>
          {error && (
            <p className="text-[11px] text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2 text-center font-mono">
              {error}
            </p>
          )}
          {printState === "loading" && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-mono">Gerando PDF...</p>
            </div>
          )}
          {printState === "done" && doc && (
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-bold font-mono py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
              >
                <Eye className="size-4" />
                Visualizar PDF
              </button>
              <PDFDownloadLink document={doc} fileName={fileName} className="w-full">
                {({ loading, url }) => (
                  <button
                    disabled={loading || !url}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold font-mono py-3 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Download className="size-4" />
                    {loading ? "Preparando..." : "Baixar PDF"}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Error */}
          {error && (
            <p className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Card */}
          <div
            className="relative select-none overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
            style={{ width: 272 }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Printer size={13} style={{ color: accent }} />
                <span className="text-[11px] font-bold text-foreground">{docLabel}</span>
              </div>

              <AnimatePresence mode="wait">
                {printState === "idle" && (
                  <motion.span key="badge-ready"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="text-[9px] font-bold rounded-full px-2 py-0.5"
                    style={{ background: accent + "22", color: accent }}
                  >
                    Pronto
                  </motion.span>
                )}
                {printState === "loading" && (
                  <motion.span key="badge-loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[9px] font-semibold text-muted-foreground"
                  >
                    Carregando…
                  </motion.span>
                )}
                {printState === "printing" && (
                  <motion.span key="badge-printing"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[9px] font-bold tabular-nums"
                    style={{ color: accent }}
                  >
                    Imprimindo {printProgress}%
                  </motion.span>
                )}
                {printState === "done" && (
                  <motion.button key="badge-tearoff"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    onClick={tearOff}
                    className="flex items-center gap-1 text-[9px] font-bold rounded-full px-2 py-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: accent + "22", color: accent }}
                  >
                    <Scissors size={9} />
                    Destacar
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ── Body ── */}
            <div className="relative" style={{ minHeight: 92 }}>

              {/* Idle */}
              <AnimatePresence>
                {printState === "idle" && (
                  <motion.div key="idle"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 px-4 py-5"
                  >
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                      className="rounded-xl p-3"
                      style={{ background: accent + "18" }}
                    >
                      <Printer size={22} style={{ color: accent }} />
                    </motion.div>
                    <p className="text-[9px] text-muted-foreground text-center">
                      Clique para gerar o {docLabel}
                    </p>
                    <button
                      onClick={startPrint}
                      className="text-[10px] font-bold rounded-lg px-5 py-2 transition-all active:scale-95 hover:opacity-90 shadow-sm"
                      style={{ background: accent, color: "#fff" }}
                    >
                      Imprimir nota
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading */}
              <AnimatePresence>
                {printState === "loading" && (
                  <motion.div key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-10"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                      className="w-5 h-5 rounded-full border-2 border-transparent"
                      style={{ borderTopColor: accent }}
                    />
                    <p className="text-[9px] text-muted-foreground">Buscando dados da OS…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Printing + Done — receipt paper */}
              <AnimatePresence>
                {(printState === "printing" || printState === "done") && (
                  <motion.div key="receipt-wrap"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    {/* Printer slot */}
                    <div className="relative mx-4 mt-3 rounded-t-sm"
                      style={{ height: 7, background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", borderBottom: "none" }}
                    >
                      <div className="absolute inset-x-2 bottom-0"
                        style={{ height: 2, background: accent + "55", borderRadius: 1 }}
                      />
                    </div>

                    {/* Receipt paper */}
                    <div className="mx-4 overflow-hidden"
                      style={{
                        background: "#FAFAF7",
                        border: "1px solid #E2E1DB",
                        borderTop: "none",
                        fontFamily: "'Courier New', Courier, monospace",
                      }}
                    >
                      {/* Serrated top */}
                      <div style={{
                        height: 5,
                        backgroundImage: "repeating-linear-gradient(90deg,#FAFAF7 0px,#FAFAF7 7px,#E2E1DB 7px,#E2E1DB 8px)",
                        marginBottom: 4,
                      }} />

                      <div className="px-3 pb-1">
                        {receiptLines.slice(0, visibleLines).map((line, i) => {
                          const isSep = line.startsWith("─");
                          const isHeader = !isSep && line === line.toUpperCase()
                            && !line.includes("R$") && !line.includes("#")
                            && !line.includes("CNPJ") && !line.includes("OS #");
                          return (
                            <motion.p key={i}
                              initial={{ opacity: 0, x: -3 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.06 }}
                              style={{
                                fontSize: 7.5, lineHeight: 1.65,
                                color: isSep ? "#CCC" : isHeader ? "#111" : "#555",
                                fontWeight: isHeader ? "bold" : "normal",
                                margin: 0, letterSpacing: 0.2,
                              }}
                            >
                              {line}
                            </motion.p>
                          );
                        })}

                        {/* Blinking cursor */}
                        {printState === "printing" && (
                          <motion.p
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 0.65 }}
                            style={{ fontSize: 8, color: accent, fontWeight: "bold", margin: "2px 0 0" }}
                          >
                            ▌ Imprimindo...
                          </motion.p>
                        )}
                      </div>

                      {/* Serrated bottom (done) */}
                      {printState === "done" && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                          style={{
                            height: 5,
                            backgroundImage: "repeating-linear-gradient(90deg,#FAFAF7 0px,#FAFAF7 7px,#E2E1DB 7px,#E2E1DB 8px)",
                            marginTop: 4,
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ── */}
            <div className="px-3 py-2.5 border-t border-border">
              {printState === "done" && doc ? (
                <div className="flex items-center gap-2">
                  {/* Preview button */}
                  <motion.button
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-3 py-2 transition-all active:scale-95 border border-border hover:bg-muted flex-1 justify-center"
                  >
                    <Eye size={11} />
                    Visualizar
                  </motion.button>

                  {/* Download button */}
                  <PDFDownloadLink document={doc} fileName={fileName}>
                    {({ loading, url }) => (
                      <motion.button
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        disabled={loading || !url}
                        className="flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-3 py-2 transition-all active:scale-95 disabled:opacity-50 flex-1 justify-center shadow-sm"
                        style={{ background: accent, color: "#fff" }}
                      >
                        <Download size={11} />
                        {loading ? "…" : "Baixar"}
                      </motion.button>
                    )}
                  </PDFDownloadLink>
                </div>
              ) : (
                <p className="text-[9px] text-muted-foreground text-center py-0.5">
                  {printState === "idle"
                    ? "Toque em imprimir para gerar o documento"
                    : printState === "loading"
                      ? "Carregando dados…"
                      : "Gerando documento…"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
