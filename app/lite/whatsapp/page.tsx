"use client"

import { MessageCircle, Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function WhatsAppPage() {
  return (
    <div className="min-h-full p-8 bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground font-mono">Conexão WhatsApp</h1>
        <p className="text-muted-foreground text-lg mt-1 font-mono">Configure o bot para enviar mensagens automáticas aos clientes.</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Status */}
        <div className="bg-card rounded-3xl border border-border p-8 shadow-xs">
          <div className="flex items-center gap-5 mb-6">
            <div className="size-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <WifiOff className="size-9 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground font-mono">Desconectado</p>
              <p className="text-muted-foreground text-lg font-mono">Escaneie o QR Code para conectar</p>
            </div>
          </div>

          {/* QR placeholder */}
          <div className="bg-muted/40 border-2 border-dashed border-border rounded-2xl p-10 text-center mb-6">
            <div className="size-48 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="size-20 text-muted-foreground/50" />
            </div>
            <p className="text-foreground/90 text-lg font-medium font-mono">QR Code aparecerá aqui</p>
            <p className="text-muted-foreground text-base mt-1 font-mono">Clique em "Gerar QR Code" abaixo</p>
          </div>

          <button className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-3 font-mono shadow-md shadow-primary/20">
            <RefreshCw className="size-6" />
            Gerar QR Code
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-7 shadow-xs">
          <h3 className="text-xl font-black text-primary mb-4 font-mono">Como conectar:</h3>
          <ol className="space-y-4">
            {[
              "Abra o WhatsApp no seu celular",
              'Toque nos três pontinhos (⋮) no canto superior direito',
              'Selecione "Aparelhos conectados"',
              'Toque em "Conectar aparelho" e escaneie o QR Code acima',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="size-9 rounded-xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  {i + 1}
                </span>
                <span className="text-foreground/90 text-lg leading-snug pt-1 font-mono">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-4">
          <p className="text-amber-600 dark:text-amber-400 text-base font-medium font-mono">
            ⚠️ Configure a URL do servidor WhatsApp nas <strong>Configurações do Painel Completo</strong> para ativar esta função.
          </p>
        </div>
      </div>
    </div>
  );
}
