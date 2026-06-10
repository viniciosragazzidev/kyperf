"use client"

import { useEffect, useState, useTransition } from "react";
import { getLiteCustomersAction, getLiteCustomerOrdersAction, getLiteCustomerVehiclesAction } from "@/lib/actions/lite-actions";
import { createCustomerAction, deleteCustomerAction } from "@/lib/actions/customers-actions";
import { Search, Users, Phone, Mail, MapPin, FileText, Car, Loader2, Plus, X, Trash2, ChevronRight, User, Printer, Clock } from "lucide-react";
import dynamic from "next/dynamic";

const ThermalPrinterCard = dynamic(
  () => import("@/components/pdf/thermal-printer-card").then((m) => ({ default: m.ThermalPrinterCard })),
  { ssr: false }
);

type Customer = {
  id: string; name: string; phone: string; email?: string | null;
  document?: string | null; address?: string | null;
  createdAt: Date | string; vehiclesCount?: number; workOrdersCount?: number;
};

const EMPTY_FORM = {
  name: "", phone: "", document: "", email: "", address: "",
  // veículo inicial
  plate: "", brand: "", model: "", year: "", engine: "", mileage: "",
};

const Field = ({
  label, value, onChange, placeholder, type = "text", required = false, mono = false, span = false
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; mono?: boolean; span?: boolean;
}) => (
  <div className={span ? "col-span-2" : ""}>
    <label className="block text-[10px] font-bold text-gray-500 font-mono tracking-widest mb-1.5">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm 
                  text-gray-900 placeholder-gray-400 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10
                  transition-all ${mono ? "font-mono tracking-widest uppercase" : "font-sans"}`}
    />
  </div>
);

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addVehicle, setAddVehicle] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const load = () => {
    setLoading(true);
    getLiteCustomersAction().then(r => {
      if (r.success) setCustomers(r.data as Customer[]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const set = (field: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm(p => ({ ...p, [field]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.phone) { setError("Nome e WhatsApp são obrigatórios."); return; }
    startTransition(async () => {
      const r = await createCustomerAction({
        name: form.name,
        phone: form.phone.replace(/\D/g, ""),
        document: form.document || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        initialVehicle: addVehicle && form.plate ? {
          plate: form.plate, brand: form.brand, model: form.model,
          year: form.year || undefined, 
          engine: form.engine || undefined, 
          mileage: form.mileage || undefined,
        } : undefined,
      });
      if (r.success) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        setAddVehicle(false);
        load();
      } else {
        setError((r as any).error || "Erro ao cadastrar.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cliente e todos os seus veículos?")) return;
    setDeletingId(id);
    await deleteCustomerAction(id);
    setDeletingId(null);
    load();
  };

  const fmtPhone = (p: string) => {
    const d = p.replace(/\D/g, "");
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    return p;
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search.replace(/\D/g, "")) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full flex flex-col bg-[#F8FAFC]">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0 bg-white">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-mono tracking-tight">CLIENTES</h1>
          <p className="text-gray-500 text-sm mt-0.5 font-mono">{customers.length} cadastrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 
                     border border-emerald-200 text-emerald-700 px-5 py-3 rounded-xl 
                     text-sm font-bold font-mono transition-all shadow-sm"
        >
          <Plus className="size-4" />
          NOVO CLIENTE
        </button>
      </div>

      {/* Search */}
      <div className="px-8 py-4 border-b border-gray-200 bg-white">
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail..."
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
            <Users className="size-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 font-mono">
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
            </p>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              {search ? "Tente outro termo" : "Clique em NOVO CLIENTE para cadastrar"}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-3">
            {filtered.map(c => (
              <div key={c.id}
                className="bg-white border border-gray-200 shadow-sm rounded-2xl px-5 py-4
                           hover:border-emerald-500/30 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="size-11 rounded-xl bg-emerald-50 border border-emerald-100 
                                    flex items-center justify-center shrink-0">
                      <span className="text-emerald-700 font-black text-base font-mono">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="font-bold text-gray-900 text-base truncate hover:text-emerald-700 transition-colors text-left"
                      >
                        {c.name}
                      </button>
                      
                      {/* Info row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                        <span className="flex items-center gap-1.5 text-gray-500 text-sm font-mono">
                          <Phone className="size-3 text-gray-400" /> {fmtPhone(c.phone)}
                        </span>
                        {c.email && (
                          <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                            <Mail className="size-3 text-gray-400" /> {c.email}
                          </span>
                        )}
                        {c.document && (
                          <span className="flex items-center gap-1.5 text-gray-500 text-xs font-mono">
                            <FileText className="size-3" /> {c.document}
                          </span>
                        )}
                        {c.address && (
                          <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <MapPin className="size-3" /> {c.address}
                          </span>
                        )}
                      </div>
 
                      {/* Counts */}
                      {(c.vehiclesCount !== undefined || c.workOrdersCount !== undefined) && (
                        <div className="flex items-center gap-3 mt-2">
                          {c.vehiclesCount !== undefined && (
                            <span className="flex items-center gap-1 text-xs text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded-md">
                              <Car className="size-3" /> {c.vehiclesCount} veículo{c.vehiclesCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {c.workOrdersCount !== undefined && (
                            <button
                              onClick={() => setSelectedCustomer(c)}
                              className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-mono bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200/40 transition-all cursor-pointer font-bold"
                            >
                              <FileText className="size-3" /> {c.workOrdersCount} OS
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener"
                      className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 
                                 rounded-lg text-xs font-mono font-bold hover:bg-emerald-100 transition-colors shadow-sm"
                    >
                      WhatsApp
                    </a>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 
                                 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                      {deletingId === c.id
                        ? <Loader2 className="size-4 animate-spin" />
                        : <Trash2 className="size-4" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal: Novo Cliente ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white border border-gray-200 rounded-3xl shadow-2xl 
                          w-full max-w-xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-7 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-black text-gray-900 font-mono">NOVO CLIENTE</h2>
                <p className="text-gray-500 text-xs font-mono mt-0.5">Preencha os dados de cadastro</p>
              </div>
              <button onClick={() => setShowForm(false)}
                      className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6">

              {/* Dados pessoais */}
              <div>
                <p className="text-[10px] font-bold text-emerald-600 font-mono tracking-widest mb-4 flex items-center gap-2">
                  <User className="size-3" /> DADOS PESSOAIS
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome completo" value={form.name} onChange={set("name")} placeholder="João da Silva" required span />
                  <Field label="WhatsApp / Telefone" value={form.phone} onChange={set("phone")} placeholder="(21) 99999-9999" type="tel" required />
                  <Field label="CPF / CNPJ" value={form.document} onChange={set("document")} placeholder="000.000.000-00" />
                  <Field label="E-mail" value={form.email} onChange={set("email")} placeholder="email@exemplo.com" type="email" span />
                  <Field label="Endereço" value={form.address} onChange={set("address")} placeholder="Rua, número, bairro" span />
                </div>
              </div>

              {/* Veículo inicial */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-gray-500 font-mono tracking-widest flex items-center gap-2">
                    <Car className="size-3" /> VEÍCULO INICIAL (opcional)
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddVehicle(v => !v)}
                    className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-all shadow-sm
                      ${addVehicle
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {addVehicle ? "✓ Incluído" : "+ Incluir veículo"}
                  </button>
                </div>
                {addVehicle && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-inner">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Placa" value={form.plate} onChange={set("plate")} placeholder="ABC1234" mono required />
                      <Field label="Marca" value={form.brand} onChange={set("brand")} placeholder="Fiat" required />
                      <Field label="Modelo" value={form.model} onChange={set("model")} placeholder="Uno" required />
                      <Field label="Ano" value={form.year} onChange={set("year")} placeholder="2020" type="number" />
                      <Field label="Motor" value={form.engine} onChange={set("engine")} placeholder="1.0 Flex" />
                      <Field label="Km atual" value={form.mileage} onChange={set("mileage")} placeholder="50000" type="number" />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-mono font-medium">
                  ⚠ {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-xl py-3.5 text-sm font-bold font-mono hover:bg-gray-50 transition-colors shadow-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                        className="flex-1 bg-[#065f46] hover:bg-[#047857] shadow-lg shadow-[#065f46]/20 text-white rounded-xl py-3.5 text-sm font-black font-mono disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  CADASTRAR CLIENTE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: OS do Cliente ─── */}
      {selectedCustomer && (
        <CustomerOrdersModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

function CustomerOrdersModal({
  customer,
  onClose,
}: {
  customer: any;
  onClose: () => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<any | null>(null);
  const [printType, setPrintType] = useState<"ENTRADA" | "SAIDA">("SAIDA");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getLiteCustomerOrdersAction(customer.id),
      getLiteCustomerVehiclesAction(customer.id)
    ]).then(([rOrders, rVehicles]) => {
      if (rOrders.success) setOrders(rOrders.data as any[]);
      if (rVehicles.success) setVehicles(rVehicles.data as any[]);
      setLoading(false);
    });
  }, [customer.id]);

  const STATUS_LABEL: Record<string, string> = {
    CHECK_IN: "Check-in",
    AWAITING_BUDGET: "Orçamento",
    AWAITING_APPROVAL: "Aguard. Aprovação",
    AWAITING_PARTS: "Aguard. Peças",
    IN_PROGRESS: "Em Execução",
    TESTING_WASHING: "Teste/Lavagem",
    READY: "Pronto",
    DELIVERED: "Entregue",
  };

  const STATUS_COLOR: Record<string, string> = {
    CHECK_IN: "bg-gray-100 text-gray-600 border border-gray-200",
    AWAITING_BUDGET: "bg-amber-50 text-amber-700 border border-amber-200",
    AWAITING_APPROVAL: "bg-amber-50 text-amber-700 border border-amber-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border border-blue-200",
    AWAITING_PARTS: "bg-amber-50 text-amber-700 border border-amber-200",
    TESTING_WASHING: "bg-blue-50 text-blue-700 border border-blue-200",
    READY: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    DELIVERED: "bg-gray-100 text-gray-500 border border-gray-200",
  };

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtTime = (d: string | Date) => {
    const dt = new Date(d);
    return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-3xl shadow-2xl 
                      w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-7 py-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-gray-900 font-mono uppercase">ORDENS & VEÍCULOS</h2>
            <p className="text-gray-500 text-xs font-mono mt-0.5">Histórico de {customer.name}</p>
          </div>
          <button onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-7 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 text-emerald-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Veículos Cadastrados */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2.5">
                <h3 className="text-gray-400 text-[9px] font-black font-mono tracking-widest uppercase flex items-center gap-1.5 pl-0.5">
                  <Car className="size-3.5" strokeWidth={2.5} /> Veículos Cadastrados ({vehicles.length})
                </h3>
                {vehicles.length === 0 ? (
                  <p className="text-gray-400 text-[10px] font-black font-mono uppercase pl-0.5">Nenhum veículo cadastrado</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {vehicles.map(v => (
                      <div key={v.id} className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs">
                        <span className="bg-gray-100 border border-gray-300 text-gray-800 text-[10px] font-black font-mono tracking-wider px-1.5 py-0.5 rounded uppercase">
                          {v.plate}
                        </span>
                        <span className="text-xs font-bold text-gray-700 uppercase">{v.brand} {v.model}</span>
                        {v.year && <span className="text-[10px] font-mono text-gray-400">({v.year})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista de OS */}
              <div className="space-y-3">
                <h3 className="text-gray-400 text-[9px] font-black font-mono tracking-widest uppercase flex items-center gap-1.5 pl-0.5">
                  <FileText className="size-3.5" strokeWidth={2.5} /> Ordens de Serviço ({orders.length})
                </h3>
                {orders.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <FileText className="size-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-mono uppercase">Nenhuma O.S. encontrada para este cliente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(o => (
                <div key={o.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-black font-mono">OS #{o.osNumber}</span>
                      <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-md ${STATUS_COLOR[o.status] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                      {o.paymentStatus === "PAID" ? (
                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          PAGO
                        </span>
                      ) : (
                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          PENDENTE
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                      <Car className="size-3 text-gray-400" />
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-black tracking-wider text-gray-700">
                        {o.vehiclePlate}
                      </span>
                      <span>{o.vehicleBrand} {o.vehicleModel}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                      <Clock className="size-3" />
                      <span>{fmtTime(o.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <span className="block text-[9px] font-bold text-gray-400 font-mono uppercase tracking-wider">Valor total</span>
                      <span className="text-emerald-700 font-black font-mono text-base">{fmt(o.total || 0)}</span>
                    </div>
                    <button
                      onClick={() => setPrintingOrder(o)}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold font-mono px-3 py-2 rounded-xl border border-gray-200 transition-all shadow-xs"
                    >
                      <Printer className="size-3.5" />
                      Imprimir
                    </button>
                  </div>
                </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </div>

      {/* Imprimir OS modal embutido */}
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
    </div>
  );
}
