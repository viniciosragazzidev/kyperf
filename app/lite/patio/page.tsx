"use client"

import { useEffect, useState, useTransition } from "react";
import { getLiteOrdersAction, advanceLiteStatusAction, addLiteItemAction, getLiteItemsAction, removeLiteItemAction, updateLiteOSAction, getLitePartsAction, getLiteServicesAction } from "@/lib/actions/lite-actions";
import { getWorkOrderAction } from "@/lib/actions/orders-actions";
import { Plus, Trash2, X, CheckCircle2, Loader2, Clock, Car, User, Phone, Hash, Receipt, ChevronRight, ArrowRight, ClipboardList, Wrench, Edit, Printer, DollarSign } from "lucide-react";
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
type Item = {
  id: string; customName: string | null; quantity: number;
  unitCostPrice: string; unitSalePrice: string;
};

const COLUMNS = [
  {
    key: "orcamento",
    label: "Orçamento",
    icon: "📋",
    statuses: ["AWAITING_BUDGET", "AWAITING_APPROVAL", "CHECK_IN"],
    accent: "border-amber-500/30 text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    dot: "bg-amber-500",
  },
  {
    key: "execucao",
    label: "Em Execução",
    icon: "🔧",
    statuses: ["IN_PROGRESS", "AWAITING_PARTS", "TESTING_WASHING"],
    accent: "border-blue-500/30 text-blue-600 dark:text-blue-400",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    dot: "bg-blue-500",
  },
  {
    key: "pronto",
    label: "Pronto / Entregue",
    icon: "✅",
    statuses: ["READY", "DELIVERED"],
    accent: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-500",
  },
];

const ADVANCE_LABEL: Record<string, string> = {
  CHECK_IN:          "Solicitar Orçamento →",
  AWAITING_BUDGET:   "Iniciar Execução →",
  AWAITING_APPROVAL: "Iniciar Execução →",
  IN_PROGRESS:       "Marcar como Pronto →",
  AWAITING_PARTS:    "Marcar como Pronto →",
  TESTING_WASHING:   "Marcar como Pronto →",
  READY:             "Confirmar Entrega →",
};

const STATUS_LABEL: Record<string, string> = {
  CHECK_IN: "Check-in", AWAITING_BUDGET: "Orçamento", AWAITING_APPROVAL: "Aguard. Aprovação",
  AWAITING_PARTS: "Aguard. Peças", IN_PROGRESS: "Em Execução",
  TESTING_WASHING: "Teste/Lavagem", READY: "Pronto", DELIVERED: "Entregue",
};

const fmtTime = (d: string | Date) => {
  const dt = new Date(d);
  return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};
const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return p;
};

export default function PatioPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [addForm, setAddForm] = useState({ type: "PART" as "PART" | "SERVICE", name: "", cost: "", sale: "", qty: "1" });
  const [addLoading, setAddLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Autocomplete
  const [partsCatalog, setPartsCatalog] = useState<any[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

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

  useEffect(() => {
    load();
    getLitePartsAction().then(r => {
      if (r.success) setPartsCatalog(r.data as any[]);
    });
    getLiteServicesAction().then(r => {
      if (r.success) setServicesCatalog(r.data as any[]);
    });
  }, []);

  const openOS = (order: Order) => {
    setSelected(order);
    setLoadingItems(true);
    getLiteItemsAction(order.id).then(r => {
      if (r.success) setItems(r.data as Item[]);
      setLoadingItems(false);
    });
  };

  const handleAdvance = () => {
    if (!selected) return;
    startTransition(async () => {
      await advanceLiteStatusAction(selected.id);
      load();
      setSelected(null);
    });
  };

  const handleAddItem = async () => {
    if (!selected || !addForm.name || !addForm.sale) return;
    setAddLoading(true);
    await addLiteItemAction({
      orderId: selected.id,
      name: addForm.name,
      costPrice: addForm.cost || "0",
      salePrice: addForm.sale,
      quantity: parseInt(addForm.qty) || 1,
      type: addForm.type,
    });
    setAddForm({ type: addForm.type, name: "", cost: "", sale: "", qty: "1" });
    const r = await getLiteItemsAction(selected.id);
    if (r.success) setItems(r.data as Item[]);
    setAddLoading(false);
    load();
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeLiteItemAction(itemId);
    const r = await getLiteItemsAction(selected!.id);
    if (r.success) setItems(r.data as Item[]);
    load();
  };

  const getSuggestions = (type: 'PART' | 'SERVICE', query: string) => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    if (type === 'PART') {
      return partsCatalog.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5);
    } else {
      return servicesCatalog.filter(s => s.name.toLowerCase().includes(q)).slice(0, 5);
    }
  };

  const selectSuggestion = (suggestion: { name: string, price: string }) => {
    setAddForm(p => ({
      ...p,
      name: suggestion.name,
      sale: parseFloat(suggestion.price).toString()
    }));
    setShowItemSuggestions(false);
  };

  const total = items.reduce((a, i) => a + i.quantity * parseFloat(i.unitSalePrice), 0);
  const totalCost = items.reduce((a, i) => a + i.quantity * parseFloat(i.unitCostPrice), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="size-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-base font-mono">Carregando pátio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-8 py-5 flex items-center justify-between shrink-0 bg-card">
        <div>
          <h1 className="text-2xl font-black text-foreground font-mono tracking-tight">PÁTIO DE CARROS</h1>
          <p className="text-muted-foreground text-sm mt-0.5 font-mono">{orders.length} ordens · {orders.filter(o => !["DELIVERED"].includes(o.status)).length} abertas</p>
        </div>
        <Link
          href="/lite/nova-os"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold font-mono transition-all shadow-sm"
        >
          <Plus className="size-4" />
          NOVA O.S.
        </Link>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-5 p-6 h-full min-w-max">
          {COLUMNS.map(col => {
            const colOrders = orders.filter(o => col.statuses.includes(o.status));
            return (
              <div key={col.key} className="w-80 flex flex-col shrink-0">
                {/* Column header */}
                <div className={`flex items-center justify-between mb-4 px-1`}>
                  <div className="flex items-center gap-2">
                    <div className={`size-2.5 rounded-full ${col.dot} shadow-xs`} />
                    <span className={`text-sm font-black font-mono tracking-tight ${col.accent.split(" ")[1]}`}>
                      {col.icon} {col.label.toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg ${col.badge}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 overflow-y-auto flex-1 no-scrollbar">
                  {colOrders.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl bg-card/30">
                      <p className="text-3xl mb-2 grayscale opacity-50">🚗</p>
                      <p className="text-muted-foreground text-sm font-bold font-mono">Sem carros aqui</p>
                    </div>
                  )}
                  {colOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => openOS(order)}
                      className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/45 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 active:scale-[0.98] group shadow-xs"
                    >
                      {/* Plate + status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-muted border border-border text-foreground font-black text-lg tracking-widest rounded-lg px-3 py-1.5 font-mono shadow-inner">
                          {order.vehiclePlate}
                        </div>
                        <span className={`text-[10px] font-black font-mono px-2 py-1 rounded-lg ${col.badge} shadow-xs`}>
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                      </div>

                      {/* Vehicle */}
                      <div className="flex items-center gap-1.5 text-foreground/90 text-sm font-black mb-1 font-mono uppercase">
                        <Car className="size-3.5 text-muted-foreground/60" />
                        {order.vehicleBrand} {order.vehicleModel}
                      </div>

                      {/* Customer */}
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3 font-medium">
                        <User className="size-3.5 text-muted-foreground/50" />
                        {order.customerName}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/40">
                        <div className="flex items-center gap-1 text-muted-foreground/70 text-[10px] font-bold font-mono uppercase">
                          <Clock className="size-3" />
                          {fmtTime(order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-primary font-black text-sm font-mono">
                            {fmt(order.total)}
                          </span>
                          <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>

                      {/* OS Number */}
                      <div className="flex items-center gap-1 text-muted-foreground/50 text-[10px] font-bold font-mono mt-2 uppercase">
                        <Hash className="size-3" /> OS {order.osNumber}
                        {order.customerPhone && (
                          <>
                            <span className="mx-1 opacity-30">·</span>
                            <Phone className="size-3" /> {fmtPhone(order.customerPhone)}
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OS Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-background/80 backdrop-blur-xs" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto flex flex-col shadow-2xl">
            
            {/* Drawer Header */}
            <div className="border-b border-border px-6 py-6 flex items-start justify-between shrink-0 bg-card">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-muted border border-border text-foreground font-black text-xl tracking-widest rounded-lg px-3 py-1 font-mono shadow-inner">
                    {selected.vehiclePlate}
                  </div>
                  <span className="text-primary text-xs font-black font-mono border border-primary/20 bg-primary/10 px-2.5 py-1 rounded-lg shadow-xs uppercase">
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>
                <h3 className="text-foreground font-black text-xl font-mono uppercase tracking-tight">{selected.vehicleBrand} {selected.vehicleModel}</h3>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-foreground/95 text-sm font-bold flex items-center gap-1.5">
                    <User className="size-4 text-muted-foreground/60" /> {selected.customerName}
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-foreground/95 text-sm font-bold flex items-center gap-1.5 font-mono">
                    <Phone className="size-4 text-muted-foreground/60" /> {fmtPhone(selected.customerPhone)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="bg-muted text-muted-foreground text-[10px] font-black font-mono px-2 py-0.5 rounded-md border border-border">
                      OS #{selected.osNumber}
                    </span>
                    <span className="text-muted-foreground/60 text-[10px] font-bold font-mono uppercase">
                      Aberto em {fmtTime(selected.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(selected.id)}
                      disabled={loadingEdit}
                      className="flex items-center gap-1 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold font-mono px-3 py-1.5 rounded-lg border border-border transition-all shadow-xs disabled:opacity-50"
                      title="Editar OS"
                    >
                      {loadingEdit ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Edit className="size-3.5" />
                      )}
                      Editar
                    </button>
                    <button
                      onClick={() => setPrintingOrder(selected)}
                      className="flex items-center gap-1 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold font-mono px-3 py-1.5 rounded-lg border border-border transition-all shadow-xs"
                      title="Imprimir OS"
                    >
                      <Printer className="size-3.5" />
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} 
                      className="ml-4 p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border">
                <X className="size-6" />
              </button>
            </div>

            {/* Budget link */}
            {selected.budgetAccessCode && (
              <div className="border-b border-primary/10 bg-primary/5 px-6 py-5">
                <p className="text-primary text-[10px] font-black font-mono mb-2 tracking-widest flex items-center gap-2">
                  <Receipt className="size-3.5" /> LINK DO ORÇAMENTO (ENVIAR AO CLIENTE)
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-card border border-primary/20 px-4 py-3 rounded-xl text-primary font-mono text-sm flex-1 truncate shadow-inner">
                    /orcamento/{selected.budgetAccessCode}
                  </code>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/orcamento/${selected.budgetAccessCode}`;
                      navigator.clipboard.writeText(url);
                    }}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-black font-mono hover:bg-primary/90 transition-all shadow-md shadow-primary/20 shrink-0"
                  >
                    COPIAR
                  </button>
                </div>
              </div>
            )}

            {/* Items list */}
            <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto bg-muted/30">
              
              <div>
                <h3 className="text-muted-foreground/70 text-[10px] font-black font-mono tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ClipboardList className="size-4" /> PEÇAS E SERVIÇOS
                </h3>

                {loadingItems ? (
                  <div className="text-center py-10">
                    <Loader2 className="size-8 animate-spin text-primary mx-auto" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl bg-card shadow-inner">
                    <p className="text-4xl mb-2 grayscale opacity-50">📦</p>
                    <p className="text-muted-foreground text-sm font-black font-mono uppercase">Nenhuma peça lançada</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {items.map(item => {
                      const itemTotal = item.quantity * parseFloat(item.unitSalePrice);
                      const margin = parseFloat(item.unitSalePrice) - parseFloat(item.unitCostPrice);
                      const marginPct = parseFloat(item.unitCostPrice) > 0 
                        ? Math.round((margin / parseFloat(item.unitSalePrice)) * 100) : 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-card border border-border/80 rounded-2xl px-5 py-4 shadow-xs hover:shadow-md transition-all">
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-foreground text-sm truncate uppercase font-mono">{item.customName || "Item"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-muted-foreground text-xs font-bold font-mono bg-muted px-2 py-0.5 rounded-md">
                                {item.quantity} × {fmt(parseFloat(item.unitSalePrice))}
                              </span>
                              {marginPct > 0 && (
                                <span className="text-primary text-[10px] font-black font-mono uppercase">↑{marginPct}% LUCRO</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <p className="text-primary font-black text-base font-mono">{fmt(itemTotal)}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="ml-3 p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground/40 hover:text-destructive transition-all border border-transparent hover:border-destructive/20"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Totals */}
                    <div className="bg-card border border-border rounded-2xl p-5 mt-4 space-y-2.5 shadow-xs">
                      <div className="flex justify-between text-xs font-bold font-mono uppercase">
                        <span className="text-muted-foreground/75 tracking-wider">Custo total estoque</span>
                        <span className="text-foreground/90">{fmt(totalCost)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border/40">
                        <span className="text-foreground font-black text-sm font-mono tracking-tight">TOTAL AO CLIENTE</span>
                        <span className="text-primary font-black text-2xl font-mono">{fmt(total)}</span>
                      </div>
                      {totalCost > 0 && (
                        <div className="flex justify-between text-[10px] font-black font-mono uppercase pt-1 text-primary">
                          <span className="tracking-widest">Lucro bruto estimado</span>
                          <span>{fmt(total - totalCost)} ({Math.round(((total - totalCost) / total) * 100)}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Add item form */}
              <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-xs">
                <h4 className="text-muted-foreground/75 text-[10px] font-black font-mono tracking-[0.2em] uppercase flex items-center gap-2">
                  <Plus className="size-4" /> LANÇAR PEÇA OU SERVIÇO
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground/85 font-mono tracking-widest block mb-1.5 uppercase">TIPO DE ITEM</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAddForm(p => ({ ...p, type: "PART", name: "", sale: "", cost: "" }))}
                        className={`py-2 rounded-xl text-xs font-bold font-mono border transition-all ${
                          addForm.type === "PART"
                            ? "bg-primary/10 border-primary/20 text-primary shadow-xs"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        PEÇA (PRODUTO)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddForm(p => ({ ...p, type: "SERVICE", name: "", sale: "", cost: "" }))}
                        className={`py-2 rounded-xl text-xs font-bold font-mono border transition-all ${
                          addForm.type === "SERVICE"
                            ? "bg-primary/10 border-primary/20 text-primary shadow-xs"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        SERVIÇO (MÃO DE OBRA)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground/85 font-mono tracking-widest block mb-1.5 uppercase">NOME DO ITEM</label>
                    <div className="relative">
                      <input
                        placeholder={addForm.type === "PART" ? "EX: PASTILHA COBREQ DIANT." : "EX: ALINHAMENTO E BALANCEAMENTO"}
                        value={addForm.name}
                        onFocus={() => setShowItemSuggestions(true)}
                        onChange={e => {
                          setAddForm(p => ({ ...p, name: e.target.value.toUpperCase() }));
                          setShowItemSuggestions(true);
                        }}
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-4 text-sm text-foreground placeholder-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none font-mono font-bold transition-all uppercase"
                        autoComplete="off"
                      />
                      {showItemSuggestions && (
                        <SuggestionsDropdown
                          suggestions={getSuggestions(addForm.type, addForm.name)}
                          onSelect={selectSuggestion}
                          onClose={() => setShowItemSuggestions(false)}
                        />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-muted-foreground/85 font-mono tracking-widest block mb-1.5 uppercase text-center">CUSTO</label>
                      <input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        value={addForm.cost}
                        onChange={e => setAddForm(p => ({ ...p, cost: e.target.value }))}
                        className="w-full bg-muted/50 border border-border rounded-xl px-2 py-4 text-sm text-foreground placeholder-muted-foreground/60 focus:border-primary/50 focus:outline-none font-mono font-bold text-center transition-all"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-muted-foreground/85 font-mono tracking-widest block mb-1.5 uppercase text-center">VENDA</label>
                      <input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        value={addForm.sale}
                        onChange={e => setAddForm(p => ({ ...p, sale: e.target.value }))}
                        className="w-full bg-card border-2 border-primary rounded-xl px-2 py-4 text-sm text-foreground placeholder-muted-foreground/60 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 focus:outline-none font-mono font-black text-center transition-all shadow-xs shadow-primary/10"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-muted-foreground/85 font-mono tracking-widest block mb-1.5 uppercase text-center">QTD</label>
                      <input
                        placeholder="1"
                        type="number"
                        min="1"
                        value={addForm.qty}
                        onChange={e => setAddForm(p => ({ ...p, qty: e.target.value }))}
                        className="w-full bg-muted/50 border border-border rounded-xl px-2 py-4 text-sm text-foreground placeholder-muted-foreground/60 focus:border-primary/50 focus:outline-none font-mono font-bold text-center transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddItem}
                    disabled={addLoading || !addForm.name || !addForm.sale}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-4 text-sm font-black font-mono disabled:opacity-40 hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 tracking-widest uppercase"
                  >
                    {addLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    LANÇAR ITEM →
                  </button>
                </div>
              </div>
            </div>

            {/* Advance button */}
            {ADVANCE_LABEL[selected.status] && (
              <div className="px-6 py-6 border-t border-border shrink-0 bg-card shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                <button
                  onClick={handleAdvance}
                  disabled={isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-5 text-base font-black font-mono tracking-widest disabled:opacity-50 transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-3"
                >
                  {isPending
                    ? <Loader2 className="size-5 animate-spin" />
                    : <ArrowRight className="size-5" />
                  }
                  {ADVANCE_LABEL[selected.status].toUpperCase()}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Imprimir OS */}
      {printingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xs" onClick={() => setPrintingOrder(null)}>
          <div className="relative bg-card rounded-3xl p-6 border border-border max-w-sm w-full flex flex-col items-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPrintingOrder(null)}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-foreground font-black text-lg font-mono mb-4 uppercase tracking-tight">Imprimir OS #{printingOrder.osNumber}</h3>
            
            <div className="flex gap-2 w-full mb-4">
              <button 
                type="button"
                onClick={() => setPrintType("ENTRADA")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black font-mono border transition-all ${printType === "ENTRADA" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}
              >
                ENTRADA
              </button>
              <button 
                type="button"
                onClick={() => setPrintType("SAIDA")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black font-mono border transition-all ${printType === "SAIDA" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}
              >
                SAÍDA
              </button>
            </div>

            <ThermalPrinterCard
              orderId={printingOrder.id}
              osNumber={printingOrder.osNumber}
              status={printType === "ENTRADA" ? "CHECK_IN" : "DELIVERED"}
              noAnimation={true}
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
            if (selected && selected.id === editingOrder.id) {
              // Recarrega o drawer
              getLiteOrdersAction().then(r => {
                if (r.success) {
                  const updated = (r.data as Order[]).find(o => o.id === editingOrder.id);
                  if (updated) setSelected(updated);
                }
              });
            }
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

  const fieldClass = "w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-7 py-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-foreground font-mono">EDITAR OS #{order.osNumber}</h2>
            <p className="text-muted-foreground text-xs font-mono mt-0.5">Altere as informações da ordem de serviço</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-7 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-6 py-4 text-destructive font-bold font-mono shadow-xs">
              ⚠ {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Veículo */}
            <div className="bg-muted/30 border border-border/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Car className="size-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm font-mono uppercase">VEÍCULO</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">PLACA *</label>
                  <input
                    value={form.plate}
                    onChange={e => setForm(p => ({ ...p, plate: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7) }))}
                    className={`${fieldClass} font-black font-mono tracking-widest uppercase`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">MARCA</label>
                    <input value={form.brand} onChange={set("brand")} className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">MODELO</label>
                    <input value={form.model} onChange={set("model")} className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">ANO</label>
                    <input value={form.year} onChange={set("year")} type="number" className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">MOTOR</label>
                    <input value={form.engine} onChange={set("engine")} className={fieldClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">KM ATUAL</label>
                    <input value={form.mileage} onChange={set("mileage")} type="number" className={fieldClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">NÍVEL DE COMBUSTÍVEL</label>
                  <div className="flex gap-1">
                    {["Reserva", "1/4", "1/2", "3/4", "Cheio"].map(lvl => (
                      <button
                        key={lvl} type="button"
                        onClick={() => setForm(p => ({ ...p, fuelLevel: lvl }))}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all border ${
                          form.fuelLevel === lvl 
                            ? "bg-primary/10 border-primary/20 text-primary" 
                            : "bg-card border-border text-muted-foreground hover:bg-muted/50"
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
            <div className="bg-muted/30 border border-border/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <User className="size-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm font-mono uppercase">CLIENTE</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">NOME COMPLETO *</label>
                  <input value={form.customerName} onChange={set("customerName")} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">WHATSAPP *</label>
                  <input value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: formatPhone(e.target.value) }))} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">CPF / CNPJ</label>
                  <input value={form.customerDocument} onChange={set("customerDocument")} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">E-MAIL</label>
                  <input value={form.customerEmail} onChange={set("customerEmail")} type="email" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">ENDEREÇO</label>
                  <input value={form.customerAddress} onChange={set("customerAddress")} className={fieldClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Triagem */}
          <div className="bg-muted/30 border border-border/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <ClipboardList className="size-5 text-primary" />
              <h3 className="font-bold text-foreground text-sm font-mono uppercase">TRIAGEM & CHECKLIST</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">SINTOMAS</label>
                <textarea value={form.symptoms} onChange={set("symptoms")} rows={2} className={`${fieldClass} resize-none`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">DIAGNÓSTICO PRÉVIO</label>
                <textarea value={form.diagnostic} onChange={set("diagnostic")} rows={2} className={`${fieldClass} resize-none`} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-2">CHECKLIST DE ITENS</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { k: 'step', l: 'Estepe' }, { k: 'macaco', l: 'Macaco' }, { k: 'chaveRoda', l: 'Ch. de Roda' }, { k: 'antena', l: 'Antena' },
                  { k: 'radio', l: 'Rádio' }, { k: 'tapetes', l: 'Tapetes' }, { k: 'calotas', l: 'Calotas' }
                ].map(item => (
                  <div key={item.k} className="flex items-center justify-between bg-card border border-border p-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-muted-foreground font-mono">{item.l}</span>
                    <div className="flex bg-muted rounded-lg border border-border overflow-hidden">
                      {['P', 'A', 'N'].map(opt => (
                        <button
                          key={opt} type="button"
                          onClick={() => setForm(p => ({
                            ...p,
                            checklist: { ...p.checklist, [item.k]: opt }
                          }))}
                          className={`w-5 h-5 text-[9px] font-black transition-colors ${
                            (form.checklist as any)[item.k] === opt
                              ? opt === 'P' ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : opt === 'A' ? "bg-red-500/20 text-red-600 dark:text-red-400"
                              : "bg-muted-foreground/20 text-foreground"
                              : "text-muted-foreground/50 hover:bg-muted/30"
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
          <div className="bg-muted/30 border border-border/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Wrench className="size-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm font-mono uppercase">ITENS (Peças e Serviços)</h3>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-colors shadow-xs"
              >
                <Plus className="size-3.5" /> Adicionar Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-border rounded-xl bg-card">
                <p className="text-muted-foreground font-mono text-xs uppercase">Nenhum item lançado nesta OS</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2.5 bg-card border border-border p-3.5 rounded-xl relative">
                    <select
                      value={item.type}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[idx].type = e.target.value as any;
                        setItems(newItems);
                      }}
                      className="bg-muted border border-border rounded-lg px-2 py-1.5 text-xs font-bold font-mono text-foreground outline-none"
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
                        className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary"
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
                        className="w-14 bg-muted border border-border rounded-lg px-1 py-1.5 text-xs font-mono text-center text-foreground outline-none"
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
                        className="w-20 bg-muted border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-right text-foreground outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-muted-foreground/45 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
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
          <div className="bg-muted/30 border border-border/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <DollarSign className="size-5 text-primary" />
              <h3 className="font-bold text-foreground text-sm font-mono uppercase">FINANCEIRO & STATUS</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">DESCONTO (R$)</label>
                <input type="number" value={form.discount} onChange={set("discount")} className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">ACRÉSCIMO (R$)</label>
                <input type="number" value={form.surcharge} onChange={set("surcharge")} className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">FORMA PAGAMENTO</label>
                <select value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))} className={fieldClass}>
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">STATUS PAGAMENTO</label>
                <select value={form.paymentStatus} onChange={e => setForm(p => ({ ...p, paymentStatus: e.target.value as any }))} className={fieldClass}>
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="LATE">Atrasado</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">GARANTIA</label>
                <input value={form.warranty} onChange={set("warranty")} className={fieldClass} />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">STATUS DA OS</label>
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

          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose}
                    className="flex-1 bg-card border border-border text-foreground rounded-xl py-3.5 text-sm font-bold font-mono hover:bg-muted/50 transition-colors shadow-xs">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground rounded-xl py-3.5 text-sm font-black font-mono disabled:opacity-50 transition-all flex items-center justify-center gap-2">
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
      className="absolute z-[110] left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
      onMouseDown={e => e.stopPropagation()} // Evita fechar ao clicar no dropdown
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect({ name: s.name, price: s.salePrice || s.basePrice || "0" })}
          className="w-full text-left px-4 py-2.5 hover:bg-primary/10 text-xs font-mono text-foreground border-b border-border/40 last:border-0 transition-colors flex justify-between items-center"
        >
          <span className="font-bold truncate">{s.name}</span>
          <span className="text-primary font-black shrink-0 ml-2">
            {parseFloat(s.salePrice || s.basePrice || "0").toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </button>
      ))}
    </div>
  );
}