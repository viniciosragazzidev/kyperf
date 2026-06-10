"use client"

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FaultyTerminal from "@/components/ui/faulty-terminal";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ToolsIcon } from "@hugeicons/core-free-icons";

const GRID_MUL: [number, number] = [2, 1];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn.email({
        email,
        password,
        callbackURL: "/panel",
      });
      if (res?.error) {
        const msg = res.error.message || "Erro ao efetuar login. Verifique suas credenciais.";
        setError(msg);
        toast.error(msg);
      } else {
        toast.success("Login efetuado com sucesso! Redirecionando...");
      }
    } catch (err: any) {
      const msg = err.message || "Ocorreu um erro interno ao efetuar login.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-svh w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background Effect */}
      <div className="fixed inset-0 z-0 opacity-50 pointer-events-none">
        <FaultyTerminal
          scale={1.8}
          gridMul={GRID_MUL}
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

      {/* Login Form */}
      <div className="relative z-50 w-full max-w-md px-8 py-12 bg-zinc-950/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2 justify-center">
            <HugeiconsIcon icon={ToolsIcon} strokeWidth={2} className="size-6 text-primary shrink-0" />
            <img src="/logo.svg" alt="KyperFix Logo" className="h-12 w-auto object-contain logo-invert" />
          </div>
          <p className="text-zinc-400 text-sm geist-mono">
            Acesse sua oficina para gerenciar o pátio.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-10 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-950/60 border border-red-500/20 text-red-400 text-xs geist-mono uppercase tracking-tighter rounded-lg flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 ml-1 text-xs uppercase tracking-widest geist-mono">
                E-mail
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300 ml-1 text-xs uppercase tracking-widest geist-mono">
                  Senha
                </Label>
                <Link
                  href="#"
                  className="text-xs text-emerald-500 hover:text-emerald-400 geist-mono"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
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
            {loading ? "Entrando..." : "ENTRAR NO SISTEMA"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-500 geist-mono">
          Ainda não tem conta?{" "}
          <Link href="/register" className="text-emerald-500 hover:text-emerald-400 font-medium">
            Solicitar acesso
          </Link>
        </p>
      </div>
    </div>
  );
}
