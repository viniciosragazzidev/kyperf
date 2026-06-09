"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageSquare,
  QrCode,
  Check,
  RefreshCw,
  LogOut,
  Info
} from "lucide-react"

import {
  getWhatsappConfigAction,
  checkWhatsappStatusAction,
  startWhatsappSessionAction,
  getWhatsappQrCodeAction,
  disconnectWhatsappSessionAction
} from "@/lib/actions/whatsapp-actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export default function WhatsappSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [statusCheckLoading, setStatusCheckLoading] = useState(false)

  // Saved credentials state (not displayed but used internally)
  const [apiUrl, setApiUrl] = useState("")
  const [apiToken, setApiToken] = useState("")
  const [sessionName, setSessionName] = useState("")

  // Session State
  const [status, setStatus] = useState<"DISCONNECTED" | "CONNECTED" | "CONNECTING">("DISCONNECTED")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false)

  // Polling Refs
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const qrPollingRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getWhatsappConfigAction()
      if (res.success && res.data) {
        setApiUrl(res.data.apiUrl)
        setApiToken(res.data.apiToken || "")
        setSessionName(res.data.sessionName || "")
        setStatus(res.data.status as any)
      }
    } catch (err) {
      console.error("Erro ao carregar dados do WhatsApp:", err)
    } finally {
      setLoading(false)
    }
  }

  // Poll status from server action
  const checkStatus = async () => {
    try {
      const res = await checkWhatsappStatusAction()
      if (res.success && res.status) {
        setStatus(res.status as any)
        if (res.status === "CONNECTED") {
          setQrCode(null)
          stopPolling()
        }
      }
    } catch (err) {
      console.error("Erro no polling de status:", err)
    }
  }

  // Poll QR Code if in connecting state
  const loadQrCode = async () => {
    setQrError(null)
    try {
      const res = await getWhatsappQrCodeAction()
      if (res.success && res.qr) {
        setQrCode(res.qr)
      } else {
        setQrError(res.error || "Aguardando geração do QR Code pelo servidor...")
      }
    } catch (err: any) {
      setQrError("Erro ao buscar QR Code: " + err.message)
    }
  }

  const startPolling = () => {
    stopPolling()
    // Poll status every 4 seconds
    pollingRef.current = setInterval(checkStatus, 4000)
    // Poll QR code every 8 seconds (to refresh if scanned/expired)
    qrPollingRef.current = setInterval(loadQrCode, 8000)
    
    // Initial fetch
    checkStatus()
    loadQrCode()
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (qrPollingRef.current) {
      clearInterval(qrPollingRef.current)
      qrPollingRef.current = null
    }
  }

  useEffect(() => {
    loadData()
    return () => stopPolling()
  }, [])

  // Start polling automatically if loaded status is CONNECTING
  useEffect(() => {
    if (status === "CONNECTING") {
      startPolling()
    } else {
      stopPolling()
    }
  }, [status])

  const handleStartSession = async () => {
    setConnecting(true)
    setQrError(null)
    setQrCode(null)
    try {
      const res = await startWhatsappSessionAction()
      if (res.success) {
        setStatus("CONNECTING")
      } else {
        toast.error("Erro ao iniciar sessão: " + res.error)
      }
    } catch (err: any) {
      toast.error("Erro interno: " + err.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnectClick = () => {
    setDisconnectConfirmOpen(true)
  }

  const handleConfirmDisconnect = async () => {
    setDisconnectConfirmOpen(false)
    setSubmitting(true)
    try {
      const res = await disconnectWhatsappSessionAction()
      if (res.success) {
        setStatus("DISCONNECTED")
        setQrCode(null)
        toast.success("Sessão desconectada!")
      } else {
        toast.error("Erro ao desconectar: " + res.error)
      }
    } catch (err: any) {
      toast.error("Erro ao desconectar: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSyncStatus = async () => {
    setStatusCheckLoading(true)
    try {
      const res = await checkWhatsappStatusAction()
      if (res.success) {
        setStatus(res.status as any)
        if (res.status === "CONNECTED") {
          toast.success("WhatsApp está conectado e operacional!")
        } else if (res.status === "CONNECTING") {
          toast.info("Sessão em andamento. Escaneie o QR Code.")
        } else {
          toast.warning("WhatsApp desconectado.")
        }
      } else {
        toast.error("Erro ao verificar status: " + res.error)
      }
    } catch (err: any) {
      toast.error("Erro: " + err.message)
    } finally {
      setStatusCheckLoading(false)
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <MessageSquare className="size-4.5" />
            </span>
            Integração WhatsApp
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 geist-mono">
            Conecte o WhatsApp da sua oficina para disparar orçamentos e ordens de serviço diretamente para os clientes.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-xs font-medium">
          Carregando integração...
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-6 space-y-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <QrCode className="size-4 text-emerald-500" />
              Conectar WhatsApp
            </h3>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {status === "CONNECTED" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              )}
              {status === "CONNECTING" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <RefreshCw className="size-3 animate-spin" />
                  Aguardando Scan
                </span>
              )}
              {status === "DISCONNECTED" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 bg-zinc-500/10 text-muted-foreground border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  Desconectado
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <AnimatePresence mode="wait">
              {status === "CONNECTED" && (
                <motion.div 
                  key="connected-state"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex flex-col items-center text-center space-y-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl w-full"
                >
                  <div className="bg-emerald-500 text-white rounded-full p-3 shadow-lg shadow-emerald-500/20">
                    <Check className="size-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Sessão Ativa</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      Seu WhatsApp está vinculado e pronto para disparar orçamentos e notas em PDF diretamente.
                    </p>
                  </div>
                </motion.div>
              )}

              {status === "CONNECTING" && (
                <motion.div 
                  key="connecting-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center space-y-4 w-full"
                >
                  {qrCode ? (
                    <div className="p-3 bg-white border border-border rounded-2xl shadow-sm">
                      <img 
                        src={qrCode} 
                        alt="WhatsApp QR Code" 
                        className="w-48 h-48 select-none"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-muted/20 border border-border/50 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-4">
                      <RefreshCw className="size-8 text-muted-foreground animate-spin" />
                      <p className="text-[10px] text-muted-foreground mt-3 leading-normal">
                        {qrError || "Aguardando geração do QR Code pelo servidor..."}
                      </p>
                    </div>
                  )}

                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-bold text-foreground flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Escaneie o QR Code acima
                    </p>
                    <p className="text-[9px] text-muted-foreground max-w-[220px]">
                      Abra o WhatsApp no celular &gt; Menu &gt; Dispositivos Conectados e aponte a câmera.
                    </p>
                  </div>
                </motion.div>
              )}

              {status === "DISCONNECTED" && (
                <motion.div 
                  key="disconnected-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center space-y-4 py-8"
                >
                  <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center text-muted-foreground border border-border/50">
                    <QrCode className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">Aparelho Desconectado</h4>
                    <p className="text-[10px] text-muted-foreground leading-normal max-w-[240px]">
                      Para poder enviar mensagens em segundo plano, você precisa iniciar uma nova sessão e escanear o QR Code.
                    </p>
                  </div>

                  <Button
                    onClick={handleStartSession}
                    disabled={connecting || !apiUrl}
                    className="h-10 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-full font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    {connecting ? (
                      <>
                        <RefreshCw className="size-4.5 animate-spin" />
                        Iniciando...
                      </>
                    ) : (
                      "Gerar QR Code de Conexão"
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-dashed border-border space-y-3">
            {status !== "DISCONNECTED" && (
              <Button 
                type="button"
                onClick={handleDisconnectClick}
                disabled={submitting}
                className="w-full h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full font-black uppercase tracking-wider flex items-center justify-center gap-2 text-[10px] cursor-pointer disabled:opacity-50"
              >
                <LogOut className="size-4" />
                Desconectar WhatsApp
              </Button>
            )}

            {apiUrl && (
              <Button 
                type="button"
                onClick={handleSyncStatus}
                disabled={statusCheckLoading}
                className="w-full h-10 bg-muted hover:bg-muted/80 text-foreground rounded-full font-black uppercase tracking-wider flex items-center justify-center gap-2 text-[10px] cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${statusCheckLoading ? "animate-spin" : ""}`} />
                Sincronizar Status de Conexão
              </Button>
            )}
          </div>

          <div className="bg-muted/20 p-4 border border-border/50 rounded-2xl flex gap-3 text-[10px] text-muted-foreground leading-relaxed">
            <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-foreground text-[10px] uppercase">Como funciona?</p>
              <p>
                As credenciais de comunicação são configuradas automaticamente. Basta escanear o QR Code acima usando seu celular para vincular a conta da oficina e iniciar os disparos de orçamentos e ordens de serviço.
              </p>
            </div>
          </div>

        </div>
      )}

      <ConfirmDialog
        isOpen={disconnectConfirmOpen}
        title="Desconectar WhatsApp"
        message="Tem certeza que deseja desconectar o WhatsApp da oficina? Você deixará de enviar mensagens automáticas."
        confirmText="Desconectar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDisconnect}
        onCancel={() => setDisconnectConfirmOpen(false)}
      />

    </div>
  )
}
