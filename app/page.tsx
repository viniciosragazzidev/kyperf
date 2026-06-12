"use client"

import InteractiveBg from "@/components/landing/interactive-bg";
import SmoothScroll from "@/components/landing/smooth-scroll";
import AnimatedBento from "@/components/landing/animated-bento";
import Link from "next/link";
import { 
  Wrench, 
  Car, 
  MessageSquare, 
  FileText, 
  ArrowRight, 
  Sparkles 
} from "lucide-react";

export default function Home() {
  return (
    <SmoothScroll>
      <InteractiveBg alwaysShow={true} />
      
      <div className="relative min-h-screen text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
        {/* Navigation */}
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/40 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="KyperFix Logo" className="h-8 w-auto object-contain logo-invert" />
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Acessar
              </Link>
              <Link 
                href="/register" 
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold font-mono tracking-wider uppercase px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest text-emerald-400 uppercase">
              <Sparkles className="size-3 animate-pulse" />
              Duplo Módulo: Completo & Lite
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white leading-tight uppercase">
              A GESTÃO DA SUA OFICINA, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                SIMPLIFICADA DE VERDADE
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed font-mono">
              Chega de planilhas complexas ou papelada debaixo do capô. O KyperFix integra a potência de um painel administrativo completo com a rapidez de um aplicativo Lite feito para o celular do mecânico.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/panel"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-black font-mono tracking-widest uppercase px-8 py-4 rounded-xl transition-all shadow-lg"
              >
                Painel Administrativo
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/lite"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-950/60 hover:bg-zinc-900/80 text-zinc-200 text-xs font-black font-mono tracking-widest border border-white/10 hover:border-emerald-500/30 uppercase px-8 py-4 rounded-xl transition-all"
              >
                Entrar Modo Lite
              </Link>
            </div>
          </div>
        </section>

        {/* Interactive Bento Section */}
        <section className="py-6">
          <div className="max-w-6xl mx-auto px-6 text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight uppercase">
              TECNOLOGIA FEITA PARA O MUNDO REAL
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
              Painel moderno, responsivo e projetado para otimizar tempo.
            </p>
          </div>
          <AnimatedBento />
        </section>

        {/* Feature Grid Section */}
        <section className="py-16 border-t border-white/5 bg-zinc-950/20 backdrop-blur-xs">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/15 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <Car className="size-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Gestão de Pátio Digital</h3>
                <p className="text-xs text-zinc-400 font-mono mt-2 leading-relaxed">
                  Monitore a entrada, o diagnóstico e a finalização de serviços através de um pátio em colunas intuitivo. Saiba exatamente qual veículo está em cada box.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/15 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <MessageSquare className="size-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Orçamentos via WhatsApp</h3>
                <p className="text-xs text-zinc-400 font-mono mt-2 leading-relaxed">
                  Envie orçamentos formatados de forma profissional diretamente para o cliente pelo WhatsApp com apenas um clique. Sem links confusos para quem prefere simplicidade.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/15 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <FileText className="size-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Relatórios & O.S. de Saída</h3>
                <p className="text-xs text-zinc-400 font-mono mt-2 leading-relaxed">
                  Visualize e baixe PDFs de check-in e conclusão. Formatos prontos para impressão térmica (80mm) ou A4 para entregar ao cliente em mãos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl mx-auto px-6 space-y-6 relative z-10">
            <h2 className="text-3xl font-black font-mono text-white uppercase tracking-tight">
              PRONTO PARA MODERNIZAR SUA OFICINA?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-md mx-auto">
              Experimente a eficiência do KyperFix agora mesmo. Cadastre sua oficina e crie sua primeira Ordem de Serviço em minutos.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black font-mono tracking-widest uppercase px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/30"
              >
                Começar Grátis
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center bg-zinc-950/60">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
            &copy; {new Date().getFullYear()} KyperFix. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </SmoothScroll>
  );
}
