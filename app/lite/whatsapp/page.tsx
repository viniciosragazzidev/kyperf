"use client"

import { MessageCircle, Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function WhatsAppPage() {
  return (
    <div className="min-h-full p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Conexão WhatsApp</h1>
        <p className="text-gray-500 text-lg mt-1">Configure o bot para enviar mensagens automáticas aos clientes.</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Status */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 p-8">
          <div className="flex items-center gap-5 mb-6">
            <div className="size-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <WifiOff className="size-9 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">Desconectado</p>
              <p className="text-gray-500 text-lg">Escaneie o QR Code para conectar</p>
            </div>
          </div>

          {/* QR placeholder */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center mb-6">
            <div className="size-48 mx-auto bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="size-20 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">QR Code aparecerá aqui</p>
            <p className="text-gray-400 text-base mt-1">Clique em "Gerar QR Code" abaixo</p>
          </div>

          <button className="w-full bg-[#065f46] text-white rounded-2xl py-5 text-xl font-bold 
                             hover:bg-[#047857] transition-colors flex items-center justify-center gap-3">
            <RefreshCw className="size-6" />
            Gerar QR Code
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-7">
          <h3 className="text-xl font-black text-[#065f46] mb-4">Como conectar:</h3>
          <ol className="space-y-4">
            {[
              "Abra o WhatsApp no seu celular",
              'Toque nos três pontinhos (⋮) no canto superior direito',
              'Selecione "Aparelhos conectados"',
              'Toque em "Conectar aparelho" e escaneie o QR Code acima',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="size-9 rounded-xl bg-[#065f46] text-white font-black text-lg 
                                 flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-700 text-lg leading-snug pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl px-6 py-4">
          <p className="text-amber-800 text-base font-medium">
            ⚠️ Configure a URL do servidor WhatsApp nas <strong>Configurações do Painel Completo</strong> para ativar esta função.
          </p>
        </div>
      </div>
    </div>
  );
}
