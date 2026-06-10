"use client"

import { useEffect, useState, useTransition } from "react";
import { getLiteOrdersAction, updateLiteOSAction, getLitePartsAction, getLiteServicesAction } from "@/lib/actions/lite-actions";
import { getWorkOrderAction } from "@/lib/actions/orders-actions";
import { Search, FileText, Loader2, Printer, Car, User, Calendar, Hash, Edit, X, DollarSign, ClipboardList, Wrench, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const ThermalPrinterCard = dynamic(
  () => import("@/components/pdf/thermal-printer-card").then((m) => ({ default: m.ThermalPrinterCard })),
  { ssr: false }
);

type Order = {
  id: string; osNumber: number; status: string; paymentStatus: string;
  customerName: string; customerPhone: string;
  vehiclePlate: string; vehicleBrand: string; vehicleModel: string;
  total: number; budgetAccessCode: string | null; createdAt: string | Date;
};

const STATUS_LABEL: Record<string, string> = {
  CHECK_IN: "Check-in", AWAITING_BUDGET: "Orçamento", AWAITING_APPROVAL: "Aguard. Aprovação",
  AWAITING_PARTS: "Aguard. Peças", IN_PROGRESS: "Em Execução",
  TESTING_WASHING: "Teste/Lavagem", READY: "Pronto", DELIVERED: "Entregue",
};

const STATUS_COLOR: Record<string, string> = {
  CHECK_IN: "bg-gray-100 text-gray-600",
  AWAITING_BUDGET: "bg-amber-100 text-amber-700",
  AWAITING_APPROVAL: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  READY: "bg-emerald-100 text-emerald-700",
  DELIVERED: "bg-gray-100 text-gray-500",
};

export default function OrdensPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Edição e Impressão
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<"ENTRADA" | "SAIDA">("SAIDA");

  const handleStartEdit = async (id: string) => {
    setLoadingEdit(true);
    const r = await getWorkOrderAction(id);
    setLoadingEdit(false);
    if (r.success && r.data) {
      setEditingOrder(r.data);
    } else {
      alert((r as any).error || "Erro ao carregar OS para edição.");
    }
  };

  const load = () => {
    setLoading(true);
    getLiteOrdersAction().then(r => {
      if (r.success) setOrders(r.data as Order[]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("pt-BR");

  const filtered = orders.filter(o =>
    o.osNumber.toString().includes(search) ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
    o.vehicleModel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full flex flex-col bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-mono tracking-tight">ORDENS DE SERVIÇO</h1>
          <p className="text-gray-500 text-sm mt-0.5 font-mono">{orders.length} ordens no total</p>
        </div>
        <Link
          href="/lite/nova-os"
          className="flex items-center gap-2 bg-[#065f46] hover:bg-[#047857] 
                     text-white px-5 py-3 rounded-xl 
                     text-sm font-bold font-mono transition-all shadow-sm"
        >
          Nova O.S.
        </Link>
      </div>

      {/* Search */}
      <div className="px-8 py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por OS, Cliente, Placa ou Modelo..."
            className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                       text-gray-900 placeholder-gray-400 focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none 
                       font-mono transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-10 text-emerald-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300 rounded-2xl bg-white">
            <FileText className="size-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 font-mono">
              {search ? "Nenhuma ordem encontrada" : "Nenhuma ordem cadastrada"}
            </p>
          </div>
        ) : (
          <div className="max-w-5xl space-y-3">
            {filtered.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200 px-6 py-5 
                           hover:border-emerald-500/30 hover:shadow-md transition-all shadow-sm flex items-center gap-6"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* OS Info */}
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      <Hash className="size-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-lg font-mono">#{order.osNumber}</p>
                      <p className="text-gray-400 text-[10px] font-bold font-mono uppercase">{fmtDate(order.createdAt)}</p>
                    </div>
                  </div>

                  {/* Customer / Vehicle */}
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-gray-400" />
                      <span className="font-bold text-gray-700 text-sm truncate">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="size-3.5 text-gray-400" />
                      <span className="text-gray-500 text-xs font-mono uppercase">{order.vehiclePlate} · {order.vehicleBrand} {order.vehicleModel}</span>
                    </div>
                  </div>

                  {/* Status / Total */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-md uppercase ${STATUS_COLOR[order.status] || "bg-gray-100"}`}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                    <p className="text-emerald-700 font-black text-lg font-mono">{fmt(order.total)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEdit(order.id)}
                    disabled={loadingEdit}
                    className="p-3 bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 shadow-sm disabled:opacity-50"
                    title="Editar OS"
                  >
                    {loadingEdit ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Edit className="size-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setPrintingOrder(order)}
                    className="p-3 bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 shadow-sm"
                    title="Imprimir OS"
                  >
                    <Printer className="size-5" />
                  </button>
                  <Link
                    href={`/lite/patio`} // Abre o detalhe no pátio (poderia ser uma rota dedicada, mas o pátio já tem o drawer)
                    className="p-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl transition-all shadow-sm flex items-center justify-center font-bold text-xs"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Imprimir OS */}
      {printingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-xs" onClick={() => setPrintingOrder(null)}>
          <div className="relative bg-white rounded-3xl p-6 border border-gray-100 max-w-sm w-full flex flex-col items-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPrintingOrder(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-gray-900 font-black text-lg font-mono mb-4 uppercase tracking-tight">Imprimir OS #{printingOrder.osNumber}</h3>
            
            <div className="flex gap-2 w-full mb-4">
              <button 
                type="button"
                onClick={() => setPrintType("ENTRADA")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black font-mono border transition-all ${printType === "ENTRADA" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200"}`}
              >
                ENTRADA
              </button>
              <button 
                type="button"
                onClick={() => setPrintType("SAIDA")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black font-mono border transition-all ${printType === "SAIDA" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200"}`}
              >
                SAÍDA
              </button>
            </div>

            <ThermalPrinterCard
              orderId={printingOrder.id}
              osNumber={printingOrder.osNumber}
              status={printType === "ENTRADA" ? "CHECK_IN" : "DELIVERED"}
            />
          </div>
        </div>
      )}

      {/* Editar OS */}
      {editingOrder && (
        <EditOSModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={() => {
            setEditingOrder(null);
            load();
          }}
        />
      )}
    </div>
  );
}

// ── Componente de Edição de OS completo
function EditOSModal({
  order,
  onClose,
  onSave,
}: {
  order: any;
  onClose: () => void;
  onSave: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    // Veículo
    plate: order.vehicle?.plate || "",
    brand: order.vehicle?.brand || "",
    model: order.vehicle?.model || "",
    year: order.vehicle?.year?.toString() || "",
    engine: order.vehicle?.engine || "",
    mileage: order.vehicle?.mileage?.toString() || order.currentMileage?.toString() || "",
    fuelLevel: order.fuelLevel || "1/2",
    // Cliente
    customerName: order.customer?.name || "",
    customerPhone: order.customer?.phone || "",
    customerDocument: order.customer?.document || "",
    customerEmail: order.customer?.email || "",
    customerAddress: order.customer?.address || "",
    // Triagem
    symptoms: order.notes || "",
    diagnostic: order.diagnostic || "",
    warranty: order.warranty || "",
    // Checklist
    checklist: order.checklist ? JSON.parse(order.checklist) : {
      step: 'P', macaco: 'P', chaveRoda: 'P', antena: 'P', radio: 'P', tapetes: 'P', calotas: 'P'
    },
    // Financeiro
    discount: order.discount || "0",
    surcharge: order.surcharge || "0",
    paymentMethod: order.paymentMethod || "Pix",
    paymentStatus: order.paymentStatus || "PENDING",
    status: order.status || "AWAITING_BUDGET",
  });

  // Itens da O.S.
  const [items, setItems] = useState<any[]>(
    order.items?.map((it: any) => ({
      type: it.type,
      customName: it.customName || it.partName || it.serviceName || "",
      quantity: it.quantity,
      unitSalePrice: it.unitSalePrice,
    })) || []
  );

  // Catalogo de peças e serviços para autocomplete
  const [partsCatalog, setPartsCatalog] = useState<any[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);

  useEffect(() => {
    getLitePartsAction().then(r => {
      if (r.success) setPartsCatalog(r.data as any[]);
    });
    getLiteServicesAction().then(r => {
      if (r.success) setServicesCatalog(r.data as any[]);
    });
  }, []);

  const selectSuggestion = (idx: number, suggestion: { name: string, price: string }) => {
    const newItems = [...items];
    newItems[idx].customName = suggestion.name;
    newItems[idx].unitSalePrice = parseFloat(suggestion.price).toString();
    setItems(newItems);
    setActiveSuggestionIdx(null);
  };

  const getSuggestions = (type: 'PART' | 'SERVICE', query: string) => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    if (type === 'PART') {
      return partsCatalog.filter((p: any) => p.name.toLowerCase().includes(q)).slice(0, 5);
    } else {
      return servicesCatalog.filter((s: any) => s.name.toLowerCase().includes(q)).slice(0, 5);
    }
  };

  const handleAddItem = () => {
    setItems(p => [...p, { type: 'SERVICE', customName: '', quantity: 1, unitSalePrice: '0' }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(p => p.filter((_, i) => i !== idx));
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.plate || !form.customerName || !form.customerPhone) {
      setError("Placa, Nome e WhatsApp são obrigatórios.");
      return;
    }

    startTransition(async () => {
      const r = await updateLiteOSAction({
        orderId: order.id,
        plate: form.plate,
        brand: form.brand,
        model: form.model,
        year: form.year,
        engine: form.engine,
        mileage: form.mileage,
        fuelLevel: form.fuelLevel,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerDocument: form.customerDocument,
        customerEmail: form.customerEmail,
        customerAddress: form.customerAddress,
        symptoms: form.symptoms,
        diagnostic: form.diagnostic,
        warranty: form.warranty,
        checklist: JSON.stringify(form.checklist),
        discount: form.discount,
        surcharge: form.surcharge,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentStatus as any,
        status: form.status,
        items: items.map(it => ({
          type: it.type,
          customName: it.customName,
          quantity: it.quantity,
          unitSalePrice: it.unitSalePrice,
        })),
      });

      if (r.success) {
        onSave();
      } else {
        setError(r.error || "Erro ao salvar alterações.");
      }
    });
  };

  const formatPhone = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (v.length > 10) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}`;
    else if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6, 10)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return v;
  };

  const fieldClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-3xl shadow-2xl 
                      w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-7 py-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-gray-900 font-mono">EDITAR OS #{order.osNumber}</h2>
            <p className="text-gray-500 text-xs font-mono mt-0.5">Altere as informações da ordem de serviço</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-7 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-red-700 font-bold font-mono shadow-sm">
              ⚠ {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Veículo */}
            <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <Car className="size-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm font-mono uppercase">VEÍCULO</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">PLACA *</label>
                  <input
                    value={form.plate}
                    onChange={e => setForm(p => ({ ...p, plate: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7) }))}
                    className={`${fieldClass} font-black font-mono tracking-widest uppercase`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">MARCA</label>
                    <input value={form.brand} onChange={set("brand")} className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">MODELO</label>
                    <input value={form.model} onChange={set("model")} className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">ANO</label>
                    <input value={form.year} onChange={set("year")} type="number" className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">MOTOR</label>
                    <input value={form.engine} onChange={set("engine")} className={fieldClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">KM ATUAL</label>
                    <input value={form.mileage} onChange={set("mileage")} type="number" className={fieldClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">NÍVEL DE COMBUSTÍVEL</label>
                  <div className="flex gap-1">
                    {["Reserva", "1/4", "1/2", "3/4", "Cheio"].map(lvl => (
                      <button
                        key={lvl} type="button"
                        onClick={() => setForm(p => ({ ...p, fuelLevel: lvl }))}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all border ${
                          form.fuelLevel === lvl 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                            : "bg-white border-gray-200 text-gray-500 hover:bg-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <User className="size-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm font-mono uppercase">CLIENTE</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">NOME COMPLETO *</label>
                  <input value={form.customerName} onChange={set("customerName")} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">WHATSAPP *</label>
                  <input value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: formatPhone(e.target.value) }))} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">CPF / CNPJ</label>
                  <input value={form.customerDocument} onChange={set("customerDocument")} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">E-MAIL</label>
                  <input value={form.customerEmail} onChange={set("customerEmail")} type="email" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">ENDEREÇO</label>
                  <input value={form.customerAddress} onChange={set("customerAddress")} className={fieldClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Triagem */}
          <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <ClipboardList className="size-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm font-mono uppercase">TRIAGEM & CHECKLIST</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">SINTOMAS</label>
                <textarea value={form.symptoms} onChange={set("symptoms")} rows={2} className={`${fieldClass} resize-none`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">DIAGNÓSTICO PRÉVIO</label>
                <textarea value={form.diagnostic} onChange={set("diagnostic")} rows={2} className={`${fieldClass} resize-none`} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-2">CHECKLIST DE ITENS</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { k: 'step', l: 'Estepe' }, { k: 'macaco', l: 'Macaco' }, { k: 'chaveRoda', l: 'Ch. de Roda' }, { k: 'antena', l: 'Antena' },
                  { k: 'radio', l: 'Rádio' }, { k: 'tapetes', l: 'Tapetes' }, { k: 'calotas', l: 'Calotas' }
                ].map(item => (
                  <div key={item.k} className="flex items-center justify-between bg-white border border-gray-200 p-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-600 font-mono">{item.l}</span>
                    <div className="flex bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      {['P', 'A', 'N'].map(opt => (
                        <button
                          key={opt} type="button"
                          onClick={() => setForm(p => ({
                            ...p,
                            checklist: { ...p.checklist, [item.k]: opt }
                          }))}
                          className={`w-5 h-5 text-[9px] font-black transition-colors ${
                            (form.checklist as any)[item.k] === opt
                              ? opt === 'P' ? "bg-emerald-100 text-emerald-700"
                              : opt === 'A' ? "bg-red-100 text-red-700"
                              : "bg-gray-200 text-gray-700"
                              : "text-gray-400 hover:bg-gray-50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Peças e Serviços */}
          <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Wrench className="size-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm font-mono uppercase">ITENS (Peças e Serviços)</h3>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-colors shadow-sm"
              >
                <Plus className="size-3.5" /> Adicionar Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-gray-200 rounded-xl bg-white">
                <p className="text-gray-400 font-mono text-xs uppercase">Nenhum item lançado nesta OS</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2.5 bg-white border border-gray-200 p-3.5 rounded-xl relative">
                    <select
                      value={item.type}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[idx].type = e.target.value as any;
                        setItems(newItems);
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold font-mono text-gray-900 outline-none"
                    >
                      <option value="SERVICE">SERVIÇO</option>
                      <option value="PART">PEÇA</option>
                    </select>
                    
                    <div className="relative flex-1">
                      <input
                        value={item.customName}
                        onFocus={() => setActiveSuggestionIdx(idx)}
                        onChange={e => {
                          const newItems = [...items];
                          newItems[idx].customName = e.target.value;
                          setItems(newItems);
                          setActiveSuggestionIdx(idx);
                        }}
                        placeholder="Nome do item..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-900 outline-none focus:border-emerald-500"
                        autoComplete="off"
                      />
                      {activeSuggestionIdx === idx && (
                        <SuggestionsDropdown
                          suggestions={getSuggestions(item.type, item.customName)}
                          onSelect={(s) => selectSuggestion(idx, s)}
                          onClose={() => setActiveSuggestionIdx(null)}
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...items];
                          newItems[idx].quantity = Number(e.target.value) || 1;
                          setItems(newItems);
                        }}
                        placeholder="Qtd"
                        className="w-14 bg-gray-50 border border-gray-200 rounded-lg px-1 py-1.5 text-xs font-mono text-center text-gray-900 outline-none"
                      />
                      <input
                        type="number"
                        value={item.unitSalePrice}
                        onChange={e => {
                          const newItems = [...items];
                          newItems[idx].unitSalePrice = e.target.value;
                          setItems(newItems);
                        }}
                        placeholder="Preço"
                        className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-right text-gray-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financeiro / Status */}
          <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <DollarSign className="size-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm font-mono uppercase">FINANCEIRO & STATUS</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">DESCONTO (R$)</label>
                <input type="number" value={form.discount} onChange={set("discount")} className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">ACRÉSCIMO (R$)</label>
                <input type="number" value={form.surcharge} onChange={set("surcharge")} className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">FORMA PAGAMENTO</label>
                <select value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))} className={fieldClass}>
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">STATUS PAGAMENTO</label>
                <select value={form.paymentStatus} onChange={e => setForm(p => ({ ...p, paymentStatus: e.target.value as any }))} className={fieldClass}>
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="LATE">Atrasado</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">GARANTIA</label>
                <input value={form.warranty} onChange={set("warranty")} className={fieldClass} />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">STATUS DA OS</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={`${fieldClass} font-bold`}>
                  <option value="CHECK_IN">Check-in</option>
                  <option value="AWAITING_BUDGET">Orçamento</option>
                  <option value="AWAITING_APPROVAL">Aguardando Aprovação</option>
                  <option value="AWAITING_PARTS">Aguardando Peças</option>
                  <option value="IN_PROGRESS">Em Execução</option>
                  <option value="TESTING_WASHING">Teste / Lavagem</option>
                  <option value="READY">Pronto</option>
                  <option value="DELIVERED">Entregue</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-xl py-3.5 text-sm font-bold font-mono hover:bg-gray-50 transition-colors shadow-sm">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
                    className="flex-1 bg-[#065f46] hover:bg-[#047857] shadow-lg shadow-[#065f46]/20 text-white rounded-xl py-3.5 text-sm font-black font-mono disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              SALVAR ALTERAÇÕES
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Dropdown de sugestões reutilizável para peças e serviços
function SuggestionsDropdown({
  suggestions,
  onSelect,
  onClose,
}: {
  suggestions: any[];
  onSelect: (s: { name: string, price: string }) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (suggestions.length === 0) return null;

  return (
    <div 
      className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
      onMouseDown={e => e.stopPropagation()} // Evita fechar ao clicar no dropdown
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect({ name: s.name, price: s.salePrice || s.basePrice || "0" })}
          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-xs font-mono text-gray-900 border-b border-gray-100 last:border-0 transition-colors flex justify-between items-center"
        >
          <span className="font-bold truncate">{s.name}</span>
          <span className="text-emerald-700 font-black shrink-0 ml-2">
            {parseFloat(s.salePrice || s.basePrice || "0").toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </button>
      ))}
    </div>
  );
}
