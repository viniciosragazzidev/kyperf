"use client"

import { useEffect, useState, useTransition } from "react";
import { getLiteServicesAction } from "@/lib/actions/lite-actions";
import { createServiceAction, deleteServiceAction } from "@/lib/actions/services-actions";
import { Search, Wrench, Loader2, Plus, X, Tag, Clock, FileText } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  estimatedTimeMinutes: number;
  basePrice: string;
};

const EMPTY_FORM = {
  name: "",
  description: "",
  estimatedTimeMinutes: "30",
  basePrice: "",
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

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getLiteServicesAction().then(r => {
      if (r.success) setServices(r.data as Service[]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const set = (field: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm(p => ({ ...p, [field]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.basePrice || !form.estimatedTimeMinutes) { 
      setError("Nome, preço base e tempo estimado são obrigatórios."); return; 
    }
    
    startTransition(async () => {
      const r = await createServiceAction({
        name: form.name,
        description: form.description || undefined,
        estimatedTimeMinutes: parseInt(form.estimatedTimeMinutes, 10) || 30,
        basePrice: form.basePrice.replace(",", "."),
      });
      if (r.success) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        load();
      } else {
        setError((r as any).error || "Erro ao cadastrar serviço.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este serviço definitivamente?")) return;
    setDeletingId(id);
    const r = await deleteServiceAction(id);
    setDeletingId(null);
    if (r.success) {
      load();
    } else {
      alert((r as any).error || "Erro ao excluir serviço.");
    }
  };

  const fmt = (n: string) => parseFloat(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/60 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground font-mono tracking-tight">SERVIÇOS CADASTRADOS</h1>
          <p className="text-muted-foreground text-sm mt-0.5 font-mono">{services.length} serviços no catálogo</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-5 py-3 rounded-xl text-sm font-bold font-mono transition-all shadow-sm"
        >
          <Plus className="size-4" />
          NOVO SERVIÇO
        </button>
      </div>

      {/* Search */}
      <div className="px-8 py-4 bg-card border-b border-border/60 shrink-0">
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome do serviço ou descrição..."
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
            <Wrench className="size-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground font-mono">
              {search ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}
            </p>
            <p className="text-muted-foreground/60 text-sm mt-2 font-mono">
              {search ? "Tente buscar com outro termo" : "Clique em NOVO SERVIÇO para adicionar"}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-3">
            {filtered.map(service => (
              <div
                key={service.id}
                className="bg-card rounded-2xl border border-border/60 px-6 py-5 hover:border-primary/45 hover:shadow-md transition-all shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-black text-foreground text-lg truncate uppercase font-mono">{service.name}</p>
                  {service.description && (
                    <p className="text-muted-foreground text-sm mt-1">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                      <Clock className="size-3.5 text-muted-foreground/50" /> {service.estimatedTimeMinutes} min
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-4">
                  <div>
                    <p className="text-primary font-black text-xl font-mono">{fmt(service.basePrice)}</p>
                    <p className="text-muted-foreground text-[10px] font-bold font-mono uppercase">Preço Base</p>
                  </div>
                  <button
                    onClick={() => handleDelete(service.id)}
                    disabled={deletingId === service.id}
                    className="p-3 hover:bg-destructive/10 text-muted-foreground/45 hover:text-destructive rounded-xl transition-all border border-transparent hover:border-destructive/20"
                    title="Excluir Serviço"
                  >
                    {deletingId === service.id ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <X className="size-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Novo Serviço */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs" onClick={() => setShowForm(false)} />
          <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            <div className="sticky top-0 bg-card border-b border-border px-7 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-black text-foreground font-mono">NOVO SERVIÇO</h2>
                <p className="text-muted-foreground text-xs font-mono mt-0.5">Cadastre o serviço no catálogo</p>
              </div>
              <button onClick={() => setShowForm(false)}
                      className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              
              <div>
                <p className="text-[10px] font-bold text-primary font-mono tracking-widest mb-4 flex items-center gap-2">
                  <Wrench className="size-3" /> INFORMAÇÕES BÁSICAS
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome do Serviço" value={form.name} onChange={set("name")} placeholder="Ex: Alinhamento e Balanceamento" required span />
                  <Field label="Preço Base (R$)" value={form.basePrice} onChange={set("basePrice")} placeholder="Ex: 120.00" required mono />
                  <Field label="Tempo Estimado (Minutos)" value={form.estimatedTimeMinutes} onChange={set("estimatedTimeMinutes")} type="number" placeholder="Ex: 45" required />
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5 uppercase">Descrição</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Descrição detalhada do serviço..."
                      rows={3}
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-sans resize-none"
                    />
                  </div>
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
                  CADASTRAR SERVIÇO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
