"use client"

import { useEffect, useState, useTransition } from "react";
import { getLiteVehiclesAction, getLiteCustomersAction } from "@/lib/actions/lite-actions";
import { createVehicleAction, deleteVehicleAction } from "@/lib/actions/vehicles-actions";
import { Search, Car, User, Loader2, Plus, X, Trash2, Phone, Hash } from "lucide-react";

type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number | null;
  engine?: string | null;
  mileage?: number | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
};

const EMPTY_FORM = {
  customerId: "",
  plate: "",
  brand: "",
  model: "",
  year: "",
  engine: "",
  mileage: "",
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

export default function VeiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const rVeh = await getLiteVehiclesAction();
    if (rVeh.success) setVehicles(rVeh.data as Vehicle[]);
    
    const rCust = await getLiteCustomersAction();
    if (rCust.success) setCustomers(rCust.data as Customer[]);
    
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (field: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm(p => ({ ...p, [field]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.customerId || !form.plate || !form.brand || !form.model) {
      setError("Cliente, Placa, Marca e Modelo são obrigatórios.");
      return;
    }
    
    startTransition(async () => {
      const r = await createVehicleAction({
        customerId: form.customerId,
        plate: form.plate.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        brand: form.brand,
        model: form.model,
        year: form.year ? parseInt(form.year, 10) : undefined,
        engine: form.engine || undefined,
        mileage: form.mileage ? parseInt(form.mileage, 10) : undefined,
      });
      if (r.success) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        load();
      } else {
        setError(r.error || "Erro ao cadastrar veículo.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este veículo?")) return;
    setDeletingId(id);
    await deleteVehicleAction(id);
    setDeletingId(null);
    load();
  };

  const fmtPhone = (p: string) => {
    const d = p.replace(/\D/g, "");
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    return p;
  };

  const filtered = vehicles.filter(v =>
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.brand.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase()) ||
    v.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/60 px-8 py-5 flex items-center justify-between shrink-0 bg-card">
        <div>
          <h1 className="text-2xl font-black text-foreground font-mono tracking-tight">VEÍCULOS</h1>
          <p className="text-muted-foreground text-sm mt-0.5 font-mono">{vehicles.length} cadastrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold font-mono transition-all shadow-sm"
        >
          <Plus className="size-4" />
          NOVO VEÍCULO
        </button>
      </div>

      {/* Search */}
      <div className="px-8 py-4 border-b border-border/60 bg-card">
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 z-10" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por placa, modelo, marca ou proprietário..."
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
            <Car className="size-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground font-mono">
              {search ? "Nenhum veículo encontrado" : "Nenhum veículo cadastrado"}
            </p>
            <p className="text-muted-foreground/60 text-sm mt-2 font-mono">
              {search ? "Tente outro termo de busca" : "Clique em NOVO VEÍCULO para cadastrar"}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-3">
            {filtered.map(v => (
              <div key={v.id}
                className="bg-card border border-border/60 shadow-xs rounded-2xl px-5 py-4 hover:border-primary/45 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Plate Emblem */}
                    <div className="bg-muted border border-border text-foreground font-black text-xs tracking-widest rounded-lg px-2.5 py-1.5 font-mono shadow-inner shrink-0 mt-1 uppercase">
                      {v.plate}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground text-base uppercase font-mono">{v.brand} {v.model}</p>
                      
                      {/* Spec details row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground font-mono">
                        {v.engine && <span>Motor: {v.engine}</span>}
                        {v.year && (
                          <>
                            <span className="opacity-30">·</span>
                            <span>Ano: {v.year}</span>
                          </>
                        )}
                        {v.mileage !== null && v.mileage !== undefined && (
                          <>
                            <span className="opacity-30">·</span>
                            <span>KM: {v.mileage.toLocaleString("pt-BR")}</span>
                          </>
                        )}
                      </div>

                      {/* Owner Info block */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
                        <User className="size-3.5 text-muted-foreground/50" />
                        <span className="font-bold text-foreground/80">{v.customerName}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="font-mono text-muted-foreground/75">{fmtPhone(v.customerPhone)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://wa.me/55${v.customerPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener"
                      className="px-3 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-mono font-bold hover:bg-primary/20 transition-colors shadow-xs"
                    >
                      WhatsApp
                    </a>
                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={deletingId === v.id}
                      className="p-2 text-muted-foreground/45 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                    >
                      {deletingId === v.id
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

      {/* ─── Modal: Novo Veículo ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs" onClick={() => setShowForm(false)} />
          <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 bg-card border-b border-border px-7 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-black text-foreground font-mono">NOVO VEÍCULO</h2>
                <p className="text-muted-foreground text-xs font-mono mt-0.5">Cadastre um novo carro no pátio</p>
              </div>
              <button onClick={() => setShowForm(false)}
                      className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              
              {/* Cliente */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground font-mono tracking-widest mb-1.5 uppercase">
                  PROPRIETÁRIO / CLIENTE <span className="text-destructive ml-1">*</span>
                </label>
                <select
                  value={form.customerId}
                  onChange={e => set("customerId")(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-sans"
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({fmtPhone(c.phone)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ficha técnica */}
              <div>
                <p className="text-[10px] font-bold text-primary font-mono tracking-widest mb-4 flex items-center gap-2">
                  <Car className="size-3" /> DADOS TÉCNICOS
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Placa" value={form.plate} onChange={set("plate")} placeholder="ABC1234" mono required />
                  <Field label="Marca" value={form.brand} onChange={set("brand")} placeholder="EX: FIAT" required />
                  <Field label="Modelo" value={form.model} onChange={set("model")} placeholder="EX: UNO" required span />
                  <Field label="Ano" value={form.year} onChange={set("year")} placeholder="EX: 2020" type="number" />
                  <Field label="Motor" value={form.engine} onChange={set("engine")} placeholder="EX: 1.0 FLEX" />
                  <Field label="Km atual" value={form.mileage} onChange={set("mileage")} placeholder="EX: 50000" type="number" span />
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
                  CADASTRAR VEÍCULO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
