import { getLiteBudgetByCodeAction, approveLiteBudgetAction } from "@/lib/actions/lite-actions";
import { notFound } from "next/navigation";
import ApproveButton from "./approve-button";

export default async function OrcamentoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const r = await getLiteBudgetByCodeAction(code);
  
  if (!r.success || !r.data) return notFound();
  
  const { order, customer, vehicle, items } = r.data as any;
  const fmt = (n: string | number) => parseFloat(String(n)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const total = items.reduce((a: number, i: any) => a + i.quantity * parseFloat(i.unitSalePrice), 0);
  const isApproved = order.status === "IN_PROGRESS" || order.status === "READY" || order.status === "DELIVERED";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] to-white">
      <div className="max-w-md mx-auto px-5 py-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-[#065f46] rounded-2xl mb-4">
            <span className="text-white text-2xl font-black">K</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">KYPERFIX Lite</h1>
          <p className="text-gray-500 text-lg mt-1">Orçamento de Serviço</p>
        </div>

        {/* Welcome */}
        <div className="bg-[#065f46] text-white rounded-3xl p-7 mb-6">
          <p className="text-emerald-300 text-base font-semibold mb-1">Olá, {customer?.name?.split(" ")[0]}!</p>
          <p className="text-white text-2xl font-black leading-tight">
            Aqui está o diagnóstico do seu {vehicle?.brand} {vehicle?.model}
          </p>
          <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 inline-block">
            <span className="text-emerald-200 text-sm font-mono font-bold tracking-widest">
              {vehicle?.plate} · OS #{order.osNumber}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-black text-gray-900 mb-5">Serviços e Peças</h2>
          <div className="space-y-4">
            {items.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-lg">Nenhum item lançado ainda</p>
            ) : (
              items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-gray-900 text-lg">{item.customName || "Item"}</p>
                    {item.quantity > 1 && (
                      <p className="text-gray-400 text-base">x{item.quantity}</p>
                    )}
                  </div>
                  <p className="font-black text-gray-900 text-xl shrink-0">
                    {fmt(parseFloat(item.unitSalePrice) * item.quantity)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total */}
        <div className="bg-gray-900 text-white rounded-3xl px-7 py-6 mb-8 flex items-center justify-between">
          <span className="text-xl font-bold">Total</span>
          <span className="text-4xl font-black">{fmt(total)}</span>
        </div>

        {/* CTA */}
        {isApproved ? (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-2xl font-black text-[#065f46]">Aprovado!</p>
            <p className="text-gray-600 text-lg mt-2">A oficina já recebeu sua aprovação e está trabalhando no seu carro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ApproveButton code={code} total={fmt(total)} />
            <p className="text-center text-gray-400 text-sm px-4">
              Ao aprovar, você autoriza a realização dos serviços listados acima pelo valor indicado.
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-300 text-sm mt-10">
          KYPERFIX · Sistema de Gestão de Oficinas
        </p>
      </div>
    </div>
  );
}
