"use client"

import { useEffect, useState, useTransition } from "react";
import { getLitePartsAction, adjustLitePartStockAction } from "@/lib/actions/lite-actions";
import { createPartAction, updatePartAction, deletePartAction } from "@/lib/actions/parts-actions";
import { Search, Package, Loader2, Plus, X, Tag, Edit, Trash2 } from "lucide-react";

type Part = {
  id: string; name: string; brand: string | null; sku: string | null;
  quantity: number; costPrice: string; salePrice: string;
  location?: string | null;
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
    <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5 uppercase">
      {label}{required && <span className="text-destructive ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-muted/50 border border-border rounded-xl px-4 py-3.5 text-sm 
                  text-foreground placeholder-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10
                  transition-all ${mono ? "font-mono tracking-widest uppercase" : "font-sans"}`}
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
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  const load = () => {
    setLoading(true);
    getLitePartsAction().then(r => {
      if (r.success) setParts(r.data as Part[]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleAdjustStock = async (partId: string, delta: number) => {
    setAdjustingId(partId);
    const r = await adjustLitePartStockAction(partId, delta);
    if (r.success) {
      setParts(prev => prev.map(p => p.id === partId ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p));
    } else {
      alert(r.error || "Erro ao atualizar estoque.");
    }
    setAdjustingId(null);
  };

  const handleDelete = async (partId: string) => {
    if (!confirm("Excluir esta peça do estoque?")) return;
    const r = await deletePartAction(partId);
    if (r.success) {
      load();
    } else {
      alert(r.error || "Erro ao excluir peça.");
    }
  };

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
    <div className="min-h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/60 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground font-mono tracking-tight">PEÇAS EM ESTOQUE</h1>
          <p className="text-muted-foreground text-sm mt-0.5 font-mono">{parts.length} peças cadastradas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-5 py-3 rounded-xl text-sm font-bold font-mono transition-all shadow-sm"
        >
          <Plus className="size-4" />
          NOVA PEÇA
        </button>
      </div>

      {/* Search */}
      <div className="px-8 py-4 bg-card border-b border-border/60 shrink-0">
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, marca ou SKU..."
            className="w-full pl-11 pr-4 py-3 text-sm bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none font-mono transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-10 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
            <Package className="size-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground font-mono">
              {search ? "Nenhuma peça encontrada" : "Nenhuma peça cadastrada"}
            </p>
            <p className="text-muted-foreground/60 text-sm mt-2 font-mono">
              {search ? "Tente buscar com outro termo" : "Clique em NOVA PEÇA para adicionar"}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-3">
            {filtered.map(part => (
              <div
                key={part.id}
                className="bg-card rounded-2xl border border-border/60 px-6 py-5 hover:border-primary/45 hover:shadow-md transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground text-lg truncate font-mono uppercase">{part.name}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {part.brand && (
                        <span className="text-muted-foreground text-sm font-medium">{part.brand}</span>
                      )}
                      {part.sku && (
                        <span className="bg-muted border border-border text-muted-foreground text-xs font-mono px-2 py-0.5 rounded-lg">
                          {part.sku}
                        </span>
                      )}
                      {part.location && (
                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                          📍 {part.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-primary font-black text-xl font-mono">{fmt(part.salePrice)}</p>
                    <p className="text-muted-foreground text-xs mt-1 font-mono">custo {fmt(part.costPrice)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(part.id, -1)}
                        disabled={adjustingId === part.id}
                        className="w-7 h-7 rounded-lg bg-muted hover:bg-destructive/10 border border-border hover:border-destructive/20 text-foreground hover:text-destructive font-black flex items-center justify-center transition-colors disabled:opacity-40"
                        title="Retirar 1 do estoque"
                      >
                        -
                      </button>
                      <span className="text-sm font-black font-mono w-8 text-center text-foreground">
                        {part.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(part.id, 1)}
                        disabled={adjustingId === part.id}
                        className="w-7 h-7 rounded-lg bg-muted hover:bg-primary/10 border border-border hover:border-primary/20 text-foreground hover:text-primary font-black flex items-center justify-center transition-colors disabled:opacity-40"
                        title="Adicionar 1 ao estoque"
                      >
                        +
                      </button>
                    </div>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${part.quantity > 0 ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                      {part.quantity > 0 ? "EM ESTOQUE" : "SEM ESTOQUE"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setEditingPart(part)}
                      className="flex items-center gap-1 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold font-mono px-2.5 py-1.5 rounded-lg border border-border transition-all shadow-xs"
                      title="Editar Peça"
                    >
                      <Edit className="size-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(part.id)}
                      className="p-1.5 text-muted-foreground/45 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                      title="Excluir Peça"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nova Peça */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs" onClick={() => setShowForm(false)} />
          <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="sticky top-0 bg-card border-b border-border px-7 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-black text-foreground font-mono">NOVA PEÇA</h2>
                <p className="text-muted-foreground text-xs font-mono mt-0.5">Cadastre o item no estoque</p>
              </div>
              <button onClick={() => setShowForm(false)}
                      className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              
              <div>
                <p className="text-[10px] font-bold text-primary font-mono tracking-widest mb-4 flex items-center gap-2">
                  <Package className="size-3" /> INFORMAÇÕES BÁSICAS
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome da Peça" value={form.name} onChange={set("name")} placeholder="Filtro de Óleo" required span />
                  <Field label="Marca" value={form.brand} onChange={set("brand")} placeholder="Tecfil" />
                  <Field label="Código SKU" value={form.sku} onChange={set("sku")} placeholder="TEC-123" mono />
                </div>
              </div>

              <div className="border-t border-border/40 pt-5">
                <p className="text-[10px] font-bold text-primary font-mono tracking-widest mb-4 flex items-center gap-2">
                  <Tag className="size-3" /> ESTOQUE E PRECIFICAÇÃO
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Qtd Atual" value={form.quantity} onChange={set("quantity")} type="number" required />
                  <Field label="Qtd Mínima" value={form.minQuantity} onChange={set("minQuantity")} type="number" required />
                  <Field label="Preço Custo (R$)" value={form.costPrice} onChange={set("costPrice")} placeholder="15.00" required mono />
                  <Field label="Preço Venda (R$)" value={form.salePrice} onChange={set("salePrice")} placeholder="35.00" required mono />
                </div>
              </div>

              <div className="border-t border-border/40 pt-5">
                <p className="text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-4">
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
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-destructive text-sm font-mono font-medium">
                  ⚠ {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)}
                        className="flex-1 bg-card border border-border text-foreground rounded-xl py-3.5 text-sm font-bold font-mono hover:bg-muted/50 transition-colors shadow-xs">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                        className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground rounded-xl py-3.5 text-sm font-black font-mono disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  CADASTRAR PEÇA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Peça */}
      {editingPart && (
        <EditPartModal
          part={editingPart}
          onClose={() => setEditingPart(null)}
          onSave={load}
        />
      )}
    </div>
  );
}

// Componente para Edição de Peça no estoque
function EditPartModal({
  part,
  onClose,
  onSave,
}: {
  part: any;
  onClose: () => void;
  onSave: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: part.name || "",
    brand: part.brand || "",
    sku: part.sku || "",
    quantity: part.quantity?.toString() || "0",
    minQuantity: part.minQuantity?.toString() || "2",
    costPrice: part.costPrice || "",
    salePrice: part.salePrice || "",
    location: part.location || "",
    compatibleCars: part.compatibleCars || "",
    dimension: part.dimension || "",
    size: part.size || "",
    weight: part.weight || "",
  });

  const set = (field: string) => (v: string) =>
    setForm(p => ({ ...p, [field]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.costPrice || !form.salePrice) {
      setError("Nome e preços são obrigatórios.");
      return;
    }

    startTransition(async () => {
      const r = await updatePartAction({
        id: part.id,
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
        weight: form.weight || undefined,
      });

      if (r.success) {
        onSave();
        onClose();
      } else {
        setError(r.error || "Erro ao salvar alterações.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-card border-b border-border px-7 py-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-foreground font-mono">EDITAR PEÇA</h2>
            <p className="text-muted-foreground text-xs font-mono mt-0.5">Altere os dados no estoque</p>
          </div>
          <button onClick={onClose}
                  className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          
          <div>
            <p className="text-[10px] font-bold text-primary font-mono tracking-widest mb-4 flex items-center gap-2">
              <Package className="size-3" /> INFORMAÇÕES BÁSICAS
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome da Peça" value={form.name} onChange={set("name")} placeholder="Filtro de Óleo" required span />
              <Field label="Marca" value={form.brand} onChange={set("brand")} placeholder="Tecfil" />
              <Field label="Código SKU" value={form.sku} onChange={set("sku")} placeholder="TEC-123" mono />
            </div>
          </div>

          <div className="border-t border-border/40 pt-5">
            <p className="text-[10px] font-bold text-primary font-mono tracking-widest mb-4 flex items-center gap-2">
              <Tag className="size-3" /> ESTOQUE E PRECIFICAÇÃO
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Qtd Atual" value={form.quantity} onChange={set("quantity")} type="number" required />
              <Field label="Qtd Mínima" value={form.minQuantity} onChange={set("minQuantity")} type="number" required />
              <Field label="Preço Custo (R$)" value={form.costPrice} onChange={set("costPrice")} placeholder="15.00" required mono />
              <Field label="Preço Venda (R$)" value={form.salePrice} onChange={set("salePrice")} placeholder="35.00" required mono />
            </div>
          </div>

          <div className="border-t border-border/40 pt-5">
            <p className="text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-4">
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
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-destructive text-sm font-mono font-medium">
              ⚠ {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose}
                    className="flex-1 bg-card border border-border text-foreground rounded-xl py-3.5 text-sm font-bold font-mono hover:bg-muted/50 transition-colors shadow-xs">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground rounded-xl py-3.5 text-sm font-black font-mono disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              SALVAR ALTERAÇÕES
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
