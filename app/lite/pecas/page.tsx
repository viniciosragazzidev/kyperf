"use client"

import { useEffect, useState, useTransition } from "react";
import { getLitePartsAction } from "@/lib/actions/lite-actions";
import { createPartAction } from "@/lib/actions/parts-actions";
import { Search, Package, Loader2, Plus, X, Tag } from "lucide-react";

type Part = {
  id: string; name: string; brand: string | null; sku: string | null;
  quantity: number; costPrice: string; salePrice: string;
};

const EMPTY_FORM = {
  name: "", brand: "", sku: "", quantity: "0", minQuantity: "2",
  costPrice: "", salePrice: "", location: "", compatibleCars: "",
  dimension: "", size: "", weight: ""
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
                  transition-all ${mono ? "font-mono tracking-widest" : "font-sans"}`}
    />
  </div>
);

export default function PecasPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getLitePartsAction().then(r => {
      if (r.success) setParts(r.data as Part[]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const set = (field: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm(p => ({ ...p, [field]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.costPrice || !form.salePrice) { 
      setError("Nome e preços são obrigatórios."); return; 
    }
    
    startTransition(async () => {
      const r = await createPartAction({
        name: form.name,
        brand: form.brand || undefined,
        sku: form.sku || undefined,
        quantity: parseInt(form.quantity) || 0,
        minQuantity: parseInt(form.minQuantity) || 0,
        costPrice: form.costPrice.replace(",", "."),
        salePrice: form.salePrice.replace(",", "."),
        location: form.location || undefined,
        compatibleCars: form.compatibleCars || undefined,
        dimension: form.dimension || undefined,
        size: form.size || undefined,
        weight: form.weight || undefined
      });
      if (r.success) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        load();
      } else {
        setError((r as any).error || "Erro ao cadastrar peça.");
      }
    });
  };

  const fmt = (n: string) => parseFloat(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filtered = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full flex flex-col bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-mono tracking-tight">PEÇAS EM ESTOQUE</h1>
          <p className="text-gray-500 text-sm mt-0.5 font-mono">{parts.length} peças cadastradas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 
                     border border-emerald-200 text-emerald-700 px-5 py-3 rounded-xl 
                     text-sm font-bold font-mono transition-all shadow-sm"
        >
          <Plus className="size-4" />
          NOVA PEÇA
        </button>
      </div>

      {/* Search */}
      <div className="px-8 py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, marca ou SKU..."
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
            <Package className="size-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 font-mono">
              {search ? "Nenhuma peça encontrada" : "Nenhuma peça cadastrada"}
            </p>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              {search ? "Tente buscar com outro termo" : "Clique em NOVA PEÇA para adicionar"}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-3">
            {filtered.map(part => (
              <div
                key={part.id}
                className="bg-white rounded-2xl border border-gray-200 px-6 py-5 
                           hover:border-emerald-500/30 hover:shadow-md transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-lg truncate">{part.name}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {part.brand && (
                        <span className="text-gray-500 text-sm font-medium">{part.brand}</span>
                      )}
                      {part.sku && (
                        <span className="bg-gray-100 border border-gray-200 text-gray-600 text-xs font-mono px-2 py-0.5 rounded-lg">
                          {part.sku}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-700 font-black text-xl">{fmt(part.salePrice)}</p>
                    <p className="text-gray-400 text-xs mt-1 font-mono">custo {fmt(part.costPrice)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${part.quantity > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className={`text-sm font-bold ${part.quantity > 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {part.quantity > 0 ? `${part.quantity} em estoque` : "Sem estoque"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nova Peça */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white border border-gray-200 rounded-3xl shadow-2xl 
                          w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="sticky top-0 bg-white border-b border-gray-200 px-7 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-black text-gray-900 font-mono">NOVA PEÇA</h2>
                <p className="text-gray-500 text-xs font-mono mt-0.5">Cadastre o item no estoque</p>
              </div>
              <button onClick={() => setShowForm(false)}
                      className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              
              <div>
                <p className="text-[10px] font-bold text-emerald-600 font-mono tracking-widest mb-4 flex items-center gap-2">
                  <Package className="size-3" /> INFORMAÇÕES BÁSICAS
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome da Peça" value={form.name} onChange={set("name")} placeholder="Filtro de Óleo" required span />
                  <Field label="Marca" value={form.brand} onChange={set("brand")} placeholder="Tecfil" />
                  <Field label="Código SKU" value={form.sku} onChange={set("sku")} placeholder="TEC-123" mono />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-[10px] font-bold text-emerald-600 font-mono tracking-widest mb-4 flex items-center gap-2">
                  <Tag className="size-3" /> ESTOQUE E PRECIFICAÇÃO
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Qtd Atual" value={form.quantity} onChange={set("quantity")} type="number" required />
                  <Field label="Qtd Mínima" value={form.minQuantity} onChange={set("minQuantity")} type="number" required />
                  <Field label="Preço Custo (R$)" value={form.costPrice} onChange={set("costPrice")} placeholder="15.00" required mono />
                  <Field label="Preço Venda (R$)" value={form.salePrice} onChange={set("salePrice")} placeholder="35.00" required mono />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-[10px] font-bold text-gray-400 font-mono tracking-widest mb-4">
                  ESPECIFICAÇÕES (Opcionais)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Localização" value={form.location} onChange={set("location")} placeholder="Prateleira A1" />
                  <Field label="Carros Compatíveis" value={form.compatibleCars} onChange={set("compatibleCars")} placeholder="Gol, Palio" />
                  <Field label="Dimensões" value={form.dimension} onChange={set("dimension")} placeholder="10x10x5 cm" />
                  <Field label="Tamanho" value={form.size} onChange={set("size")} placeholder="Único" />
                  <Field label="Peso" value={form.weight} onChange={set("weight")} placeholder="200g" span />
                </div>
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
                  CADASTRAR PEÇA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
