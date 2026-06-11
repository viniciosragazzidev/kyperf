"use client"

import { useState, useTransition, useEffect, useRef } from "react";
import { createWorkOrderAction } from "@/lib/actions/orders-actions";
import { getLitePartsAction, getLiteCustomersAction, getLiteServicesAction } from "@/lib/actions/lite-actions";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ArrowLeft, Car, Users, Wrench, ClipboardList, DollarSign, Plus, Trash2, Printer, Search } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const ThermalPrinterCard = dynamic(
  () => import("@/components/pdf/thermal-printer-card").then((m) => ({ default: m.ThermalPrinterCard })),
  { ssr: false }
);

type Part = { id: string; name: string; salePrice: string; type?: 'PART'|'SERVICE' };
type Customer = { 
  id: string; name: string; phone: string; document?: string | null; 
  email?: string | null; address?: string | null;
};

export default function NovaOSPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [osNum, setOsNum] = useState<number | null>(null);
  const [error, setError] = useState("");
  
  // Catalogo de peças
  const [catalog, setCatalog] = useState<Part[]>([]);
  // Catalogo de serviços
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  // Sugestões de clientes
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Controle de sugestões para os itens
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);

  // Tipo de nota para impressão
  const [printType, setPrintType] = useState<"ENTRADA" | "SAIDA">("ENTRADA");

  useEffect(() => {
    getLitePartsAction().then(r => {
      if (r.success) setCatalog(r.data as Part[]);
    });
    getLiteServicesAction().then(r => {
      if (r.success) setServicesCatalog(r.data as any[]);
    });

    // Fechar sugestões ao clicar fora
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectSuggestion = (idx: number, suggestion: { name: string, price: string }) => {
    const newItems = [...items];
    newItems[idx].name = suggestion.name;
    newItems[idx].unitSalePrice = parseFloat(suggestion.price).toString();
    setItems(newItems);
    setActiveSuggestionIdx(null);
  };

  const getSuggestions = (type: 'PART' | 'SERVICE', query: string) => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    if (type === 'PART') {
      return catalog.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5);
    } else {
      return servicesCatalog.filter(s => s.name.toLowerCase().includes(q)).slice(0, 5);
    }
  };

  const [form, setForm] = useState({
    // Veiculo
    plate: "", brand: "", model: "", year: "", engine: "", mileage: "", fuelLevel: "1/2",
    // Cliente
    customerId: "", customerName: "", customerPhone: "", customerDocument: "", customerEmail: "", customerAddress: "",
    // Triagem
    symptoms: "", diagnostic: "", warranty: "", mechanicId: "",
    // Financeiro
    discount: "0", surcharge: "0", paymentMethod: "Pix", paymentStatus: "PENDING"
  });

  const [checklist, setChecklist] = useState({
    step: 'P', macaco: 'P', chaveRoda: 'P', antena: 'P', radio: 'P', tapetes: 'P', calotas: 'P'
  });

  const [items, setItems] = useState<{type: 'PART'|'SERVICE', name: string, quantity: number, unitSalePrice: string}[]>([]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm(p => ({ ...p, [field]: val }));
    
    // Busca clientes se for o campo nome
    if (field === "customerName") {
      if (val.length >= 2) {
        getLiteCustomersAction(val).then(r => {
          if (r.success) {
            setCustomerSuggestions(r.data as Customer[]);
            setShowSuggestions(true);
          }
        });
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const selectCustomer = (c: Customer) => {
    setForm(p => ({
      ...p,
      customerId: c.id,
      customerName: c.name,
      customerPhone: formatPhone(c.phone),
      customerDocument: c.document || "",
      customerEmail: c.email || "",
      customerAddress: c.address || ""
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.plate || !form.customerName || !form.customerPhone) {
      setError("Placa, Nome e WhatsApp são obrigatórios.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    startTransition(async () => {
      const payload = {
        customerId: form.customerId || undefined,
        newCustomerName: form.customerId ? undefined : form.customerName,
        newCustomerPhone: form.customerId ? undefined : form.customerPhone,
        newCustomerDocument: (form.customerId || !form.customerDocument) ? undefined : form.customerDocument,
        newCustomerEmail: (form.customerId || !form.customerEmail) ? undefined : form.customerEmail,
        newCustomerAddress: (form.customerId || !form.customerAddress) ? undefined : form.customerAddress,
        
        newVehiclePlate: form.plate,
        newVehicleBrand: form.brand || "N/I",
        newVehicleModel: form.model || "N/I",
        newVehicleYear: form.year || undefined,
        newVehicleEngine: form.engine || undefined,
        newVehicleMileage: form.mileage || undefined,
        
        fuelLevel: form.fuelLevel,
        notes: form.symptoms || undefined,
        diagnostic: form.diagnostic || undefined,
        warranty: form.warranty || undefined,
        checklist: JSON.stringify(checklist),
        
        discount: form.discount,
        surcharge: form.surcharge,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentStatus as any,
        status: "AWAITING_BUDGET" as any,
        
        items: items.map(it => ({
          type: it.type,
          customName: it.name,
          quantity: it.quantity,
          unitCostPrice: "0",
          unitSalePrice: it.unitSalePrice,
          isApproved: 0
        }))
      };

      const r = await createWorkOrderAction(payload as any);
      if (r.success && r.data) {
        setOsNum((r.data as any).osNumber || 0);
        setCreatedOrderId((r.data as any).id);
        setDone(true);
      } else {
        setError((r as any).error || "Erro ao criar OS.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const resetForm = () => {
    setDone(false);
    setCreatedOrderId(null);
    setForm({
      plate: "", brand: "", model: "", year: "", engine: "", mileage: "", fuelLevel: "1/2",
      customerId: "", customerName: "", customerPhone: "", customerDocument: "", customerEmail: "", customerAddress: "",
      symptoms: "", diagnostic: "", warranty: "", mechanicId: "",
      discount: "0", surcharge: "0", paymentMethod: "Pix", paymentStatus: "PENDING"
    });
    setItems([]);
  };

  const formatPhone = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (v.length > 10) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}`;
    else if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6, 10)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return v;
  };

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-full p-8 bg-background">
        <div className="bg-card rounded-3xl shadow-xl border border-border p-10 max-w-md w-full text-center flex flex-col items-center">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0">
            <CheckCircle2 className="size-12 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-1 font-mono">OS #{osNum}</h2>
          <p className="text-muted-foreground text-sm mb-6 font-mono">Ordem de serviço criada com sucesso!</p>
          
          <div className="bg-muted/40 rounded-2xl p-4 mb-6 border border-border w-full flex flex-col items-center">
            <label className="block text-[10px] font-black text-muted-foreground font-mono tracking-widest mb-2 uppercase self-start">Tipo de Impressão</label>
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
            {createdOrderId && osNum && (
              <ThermalPrinterCard
                orderId={createdOrderId}
                osNumber={osNum}
                status={printType === "ENTRADA" ? "CHECK_IN" : "DELIVERED"}
                noAnimation={true}
              />
            )}
          </div>

          <div className="space-y-3 w-full">
            <button
              onClick={resetForm}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-xl font-bold hover:bg-primary/90 transition-all shadow-md font-mono"
            >
              + CRIAR OUTRA O.S.
            </button>
            <Link
              href="/lite/patio"
              className="flex items-center justify-center gap-2 w-full bg-card border-2 border-border rounded-2xl py-5 text-xl font-bold text-foreground hover:bg-muted transition-all font-mono shadow-xs"
            >
              VER PÁTIO
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fieldClass = "w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all";

  return (
    <div className="min-h-full p-6 md:p-10 bg-background">
      {/* Header */}
      <div className="mb-8 max-w-4xl mx-auto">
        <Link href="/lite/patio" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-bold font-mono mb-4 transition-colors">
          <ArrowLeft className="size-4" /> VOLTAR AO PÁTIO
        </Link>
        <h1 className="text-3xl font-black text-foreground font-mono tracking-tight">NOVA O.S.</h1>
        <p className="text-muted-foreground text-base mt-1 font-mono">Preencha as informações do veículo, cliente e triagem.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-6 py-4 text-destructive font-bold font-mono shadow-xs">
            ⚠ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Veículo */}
          <div className="bg-card rounded-3xl shadow-xs border border-border p-7 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                <Car className="size-6 text-primary" />
              </div>
              <h2 className="text-lg font-black text-foreground font-mono">VEÍCULO</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">
                  PLACA <span className="text-destructive">*</span>
                </label>
                <input
                  value={form.plate}
                  onChange={e => setForm(p => ({ ...p, plate: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,7) }))}
                  placeholder="ABC1234"
                  className={`${fieldClass} text-lg font-black font-mono tracking-widest uppercase`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">MARCA</label>
                  <input value={form.brand} onChange={set("brand")} placeholder="Ex: Fiat" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">MODELO</label>
                  <input value={form.model} onChange={set("model")} placeholder="Ex: Uno" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">ANO</label>
                  <input value={form.year} onChange={set("year")} type="number" placeholder="Ex: 2020" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">KM ATUAL</label>
                  <input value={form.mileage} onChange={set("mileage")} type="number" placeholder="Ex: 50000" className={fieldClass} />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">NÍVEL DE COMBUSTÍVEL</label>
                <div className="flex gap-2">
                  {["Reserva", "1/4", "1/2", "3/4", "Cheio"].map(lvl => (
                    <button
                      key={lvl} type="button"
                      onClick={() => setForm(p => ({...p, fuelLevel: lvl}))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                        form.fuelLevel === lvl 
                          ? "bg-primary/10 border-primary/20 text-primary" 
                          : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
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
          <div className="bg-card rounded-3xl shadow-xs border border-border p-7 space-y-5 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                <Users className="size-6 text-primary" />
              </div>
              <h2 className="text-lg font-black text-foreground font-mono">CLIENTE</h2>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">
                  NOME COMPLETO <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input 
                    value={form.customerName} 
                    onChange={set("customerName")} 
                    placeholder="Ex: João Silva" 
                    className={fieldClass} 
                    autoComplete="off"
                  />
                  {showSuggestions && customerSuggestions.length > 0 && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                    >
                      {customerSuggestions.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left px-5 py-4 hover:bg-primary/10 border-b border-border/40 last:border-0 transition-colors group flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary">{c.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{formatPhone(c.phone)}</p>
                          </div>
                          <Search className="size-4 text-muted-foreground/40 group-hover:text-primary" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">
                  WHATSAPP <span className="text-destructive">*</span>
                </label>
                <input value={form.customerPhone} onChange={e => setForm(p => ({...p, customerPhone: formatPhone(e.target.value)}))} placeholder="(21) 99999-9999" type="tel" className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">CPF / CNPJ</label>
                <input value={form.customerDocument} onChange={set("customerDocument")} placeholder="000.000.000-00" className={fieldClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">ENDEREÇO</label>
                  <input value={form.customerAddress} onChange={set("customerAddress")} placeholder="Rua, Número, Bairro" className={fieldClass} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Triagem */}
        <div className="bg-card rounded-3xl shadow-xs border border-border p-7 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <ClipboardList className="size-6 text-primary" />
            </div>
            <h2 className="text-lg font-black text-foreground font-mono">TRIAGEM & CHECK-IN</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">SINTOMAS (QUEIXA DO CLIENTE)</label>
              <textarea value={form.symptoms} onChange={set("symptoms")} rows={3} placeholder="O que está acontecendo com o veículo?" className={`${fieldClass} resize-none`} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">DIAGNÓSTICO PRÉVIO</label>
              <textarea value={form.diagnostic} onChange={set("diagnostic")} rows={3} placeholder="Qual a avaliação inicial do mecânico?" className={`${fieldClass} resize-none`} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-3">CHECKLIST DE ITENS</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {k:'step', l:'Estepe'}, {k:'macaco', l:'Macaco'}, {k:'chaveRoda', l:'Ch. de Roda'}, {k:'antena', l:'Antena'},
                {k:'radio', l:'Rádio'}, {k:'tapetes', l:'Tapetes'}, {k:'calotas', l:'Calotas'}
              ].map(item => (
                <div key={item.k} className="flex items-center justify-between bg-muted/50 border border-border p-2 rounded-xl">
                  <span className="text-xs font-bold text-muted-foreground font-mono">{item.l}</span>
                  <div className="flex bg-card rounded-lg border border-border overflow-hidden">
                    {['P','A','N'].map(opt => (
                      <button
                        key={opt} type="button"
                        onClick={() => setChecklist(p => ({...p, [item.k]: opt}))}
                        className={`w-7 h-6 text-[10px] font-black transition-colors ${
                          (checklist as any)[item.k] === opt
                            ? opt === 'P' ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                            : opt === 'A' ? "bg-red-500/20 text-red-600 dark:text-red-400" 
                            : "bg-muted text-muted-foreground"
                            : "text-muted-foreground/40 hover:bg-muted/30"
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

        {/* Orçamento (Items) */}
        <div className="bg-card rounded-3xl shadow-xs border border-border p-7 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                <Wrench className="size-6 text-primary" />
              </div>
              <h2 className="text-lg font-black text-foreground font-mono">ITENS (Peças e Serviços)</h2>
            </div>
            <button
              type="button"
              onClick={() => setItems(p => [...p, {type: 'SERVICE', name: '', quantity: 1, unitSalePrice: '0'}])}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold font-mono hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Plus className="size-3.5" /> ADICIONAR ITEM
            </button>
          </div>

          {items.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-border rounded-2xl bg-muted/30">
              <p className="text-muted-foreground font-mono text-sm">Nenhum item adicionado à O.S.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 bg-muted/30 border border-border p-4 rounded-2xl">
                  <select
                    value={item.type}
                    onChange={e => {
                      const newItems = [...items];
                      newItems[idx].type = e.target.value as any;
                      setItems(newItems);
                    }}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none focus:border-primary text-foreground"
                  >
                    <option value="SERVICE">SERVIÇO</option>
                    <option value="PART">PEÇA</option>
                  </select>
                  
                  <div className="relative flex-1">
                    <input
                      value={item.name}
                      onFocus={() => setActiveSuggestionIdx(idx)}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[idx].name = e.target.value;
                        setItems(newItems);
                        setActiveSuggestionIdx(idx);
                      }}
                      placeholder="Descrição do item..."
                      className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm font-mono outline-none focus:border-primary text-foreground"
                      autoComplete="off"
                    />
                    {activeSuggestionIdx === idx && (
                      <SuggestionsDropdown
                        suggestions={getSuggestions(item.type, item.name)}
                        onSelect={(s) => selectSuggestion(idx, s)}
                        onClose={() => setActiveSuggestionIdx(null)}
                      />
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[idx].quantity = Number(e.target.value);
                        setItems(newItems);
                      }}
                      placeholder="Qtd"
                      className="w-16 bg-card border border-border rounded-xl px-2 py-2 text-sm font-mono text-center outline-none focus:border-primary text-foreground"
                    />
                    <input
                      type="number"
                      value={item.unitSalePrice}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[idx].unitSalePrice = e.target.value;
                        setItems(newItems);
                      }}
                      placeholder="Valor Un."
                      className="w-24 bg-card border border-border rounded-xl px-3 py-2 text-sm font-mono text-right outline-none focus:border-primary text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setItems(p => p.filter((_, i) => i !== idx))}
                      className="p-2 text-muted-foreground/45 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors border border-transparent hover:border-destructive/20"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financeiro */}
        <div className="bg-card rounded-3xl shadow-xs border border-border p-7 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <DollarSign className="size-6 text-primary" />
            </div>
            <h2 className="text-lg font-black text-foreground font-mono">FINANCEIRO</h2>
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
              <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">FORMA DE PAGAMENTO</label>
              <select value={form.paymentMethod} onChange={e => setForm(p => ({...p, paymentMethod: e.target.value}))} className={fieldClass}>
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">STATUS PAGAMENTO</label>
              <select value={form.paymentStatus} onChange={e => setForm(p => ({...p, paymentStatus: e.target.value}))} className={fieldClass}>
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5">GARANTIA</label>
              <input value={form.warranty} onChange={set("warranty")} placeholder="Ex: 90 dias para serviços" className={fieldClass} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground rounded-3xl py-6 text-2xl font-black font-mono tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-60 shadow-xl shadow-primary/20 border border-primary/80"
        >
          {isPending
            ? <><Loader2 className="size-7 animate-spin" /> SALVANDO...</>
            : <>CRIAR O.S. LITE</>
          }
        </button>
      </form>
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
      className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
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