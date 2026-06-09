"use client"

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FaultyTerminal from "@/components/ui/faulty-terminal";
import Link from "next/link";
import { WrenchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signUp.email({
      email,
      password,
      name,
    });
    
    if (!error) {
      router.push("/panel");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-svh w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background Effect */}
      <div className="fixed inset-0 z-0 opacity-50 pointer-events-none">
        <FaultyTerminal
          scale={1.8}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={1.2}
          scanlineIntensity={0.5}
          curvature={0.1}
          tint="#006045"
          brightness={0.6}
          mouseReact={true}
          mouseStrength={0.5}
          pageLoadAnimation={true}
        />
      </div>

      {/* Register Form */}
      <div className="relative z-50 w-full max-w-md px-8 py-12 bg-zinc-950/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <HugeiconsIcon icon={WrenchIcon} strokeWidth={2} className="size-6" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white font-heading">
              Nova Conta
            </h1>
            <p className="text-zinc-400 text-sm geist-mono">
              Cadastre sua oficina no AutoManager PRO.
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="mt-10 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300 ml-1 text-xs uppercase tracking-widest geist-mono">
                Nome Completo
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: João da Silva"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-none border-x-0 border-t-0 border-b-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 ml-1 text-xs uppercase tracking-widest geist-mono">
                E-mail Profissional
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="mecanico@oficina.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-none border-x-0 border-t-0 border-b-2"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300 ml-1 text-xs uppercase tracking-widest geist-mono">
                Senha de Acesso
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-none border-x-0 border-t-0 border-b-2"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none target-hover-effect target-hover-trigger"
          >
            {loading ? "Criando conta..." : "FINALIZAR CADASTRO"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-500 geist-mono">
          Já possui acesso?{" "}
          <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-medium">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
