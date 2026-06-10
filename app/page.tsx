"use client"

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import InteractiveBg from "@/components/landing/interactive-bg";
import SmoothScroll from "@/components/landing/smooth-scroll";
import AnimatedBento from "@/components/landing/animated-bento";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ToolsIcon } from "@hugeicons/core-free-icons";
import { 
  ArrowRight, 
  Wrench, 
  Sparkles, 
  MessageCircle, 
  BarChart3, 
  ShieldCheck, 
  Clock, 
  ChevronRight 
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Reveal animations for hero texts
    const heroElements = gsap.utils.toArray(".hero-reveal");
    gsap.fromTo(heroElements, 
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1.2, 
        stagger: 0.15, 
        ease: "power4.out",
        delay: 0.2
      }
    );

    // 2. Storytelling chapters scroll animations (fades word-by-word/line-by-line)
    const chapters = gsap.utils.toArray(".story-chapter");
    chapters.forEach((chapter: any) => {
      gsap.fromTo(chapter.querySelectorAll(".chapter-fade"),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: chapter,
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // 3. Pin showcase: Pinned mockup representing the smart dashboard
    const pinSection = document.querySelector(".pin-section");
    const pinShowcase = document.querySelector(".pin-showcase");
    if (pinSection && pinShowcase) {
      gsap.to(pinShowcase, {
        scrollTrigger: {
          trigger: pinSection,
          start: "top 15%",
          end: "+=1200",
          pin: true,
          scrub: true,
        }
      });
    }

    // 4. Smooth background color shifts on scroll
    gsap.to(".color-overlay", {
      backgroundColor: "rgba(6, 45, 31, 0.4)", // Deep esmeralda shift
      scrollTrigger: {
        trigger: ".bento-section",
        start: "top 60%",
        end: "bottom 30%",
        scrub: true
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <SmoothScroll>
      <div ref={containerRef} className="relative min-h-screen text-zinc-300 font-mono bg-zinc-950 overflow-hidden selection:bg-emerald-500/30 selection:text-white">
        
        {/* Dynamic WebGL fluid texture background */}
        <InteractiveBg />

        {/* Global ambient noise & grid line overlays for Fable 5 tech-chic look */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        
        {/* Dynamic color shifting overlay on scroll */}
        <div className="color-overlay fixed inset-0 z-0 bg-transparent pointer-events-none transition-colors duration-1000 ease-out" />

        {/* TOP HEADER */}
        <header className="relative z-50 w-full border-b border-white/5 bg-zinc-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={ToolsIcon} strokeWidth={2} className="size-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-bold tracking-widest text-white uppercase">KYPERFIX</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-zinc-400">
            <a href="#story" className="hover:text-emerald-400 transition-colors">O Manifesto</a>
            <a href="#bento" className="hover:text-emerald-400 transition-colors">Tecnologia</a>
            <a href="#showcase" className="hover:text-emerald-400 transition-colors">Fluxo Inteligente</a>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-[10px] uppercase font-bold tracking-widest text-zinc-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="text-[10px] px-3.5 py-1.5 uppercase font-bold tracking-widest rounded-none border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              Criar Conta
            </Link>
          </div>
        </header>

        {/* 1. HERO SECTION */}
        <section ref={heroRef} className="relative z-10 min-h-[90vh] flex flex-col justify-center px-6 md:px-12 lg:px-24 py-20 border-b border-white/5">
          {/* Engineering-like float metadata coordinates */}
          <div className="absolute top-8 left-8 hidden lg:block text-[8px] text-zinc-650 tracking-widest uppercase">
            [SYS_LOC: PANEL/ROOT_MAIN] <br />
            [COORD: 22.9068° S, 43.1729° W]
          </div>

          <div className="absolute top-8 right-8 hidden lg:block text-[8px] text-emerald-500/50 tracking-widest uppercase text-right">
            [STATUS: SYSTEM_LIVE] <br />
            [ENGINE: WEBGL/OGL_1.2]
          </div>

          {/* Centered Floating Badge */}
          <div className="hero-reveal inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/20 px-3.5 py-1 rounded-full text-[9px] uppercase tracking-widest text-emerald-400 font-bold max-w-fit mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SaaS Operacional Premium para Oficinas Mecânicas
          </div>

          {/* Cinematic Monospace Titles */}
          <h1 className="hero-reveal text-4xl md:text-6xl lg:text-7xl font-bold text-white uppercase tracking-tighter leading-none max-w-4xl">
            A EVOLUÇÃO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600">DE HAUTE COUTURE</span> <br />
            DO SEU PÁTIO.
          </h1>

          <p className="hero-reveal text-xs md:text-sm text-zinc-400 max-w-2xl mt-6 tracking-wide leading-relaxed font-sans dark:text-zinc-400">
            Esqueça os relatórios cinzas do Windows 95 e planilhas riscadas de óleo. O KYPERFIX redesenha a gestão da sua oficina com controle em tempo real, disparos automáticos de WhatsApp e relatórios que respiram profissionalismo.
          </p>

          <div className="hero-reveal flex flex-wrap gap-4 mt-8">
            <Link 
              href="/register" 
              className="h-12 px-6 flex items-center gap-2 bg-emerald-500 text-zinc-950 font-bold uppercase text-xs hover:bg-emerald-400 transition-all rounded-none target-hover-effect"
            >
              Fazer Cadastro da Oficina
              <ArrowRight className="size-4" />
            </Link>
            <Link 
              href="#story" 
              className="h-12 px-6 flex items-center justify-center border border-white/10 text-zinc-300 font-bold uppercase text-xs hover:bg-white/5 transition-all rounded-none"
            >
              Conhecer Manifesto
            </Link>
          </div>
        </section>

        {/* 2. STORYTELLING / THE MANIFESTO */}
        <section id="story" className="relative z-10 px-6 md:px-12 lg:px-24 py-32 border-b border-white/5 bg-zinc-950/20">
          <div className="max-w-4xl mx-auto space-y-28">
            
            {/* CHAPTER 1 */}
            <div className="story-chapter grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 chapter-fade text-[10px] text-emerald-500 font-bold uppercase tracking-widest pt-1">
                [CAPÍTULO I: O ANACRONISMO]
              </div>
              <div className="md:col-span-3 space-y-4">
                <h2 className="chapter-fade text-xl md:text-2xl font-bold text-white uppercase tracking-tight font-mono">
                  O erro clássico dos sistemas antigos.
                </h2>
                <p className="chapter-fade text-xs md:text-sm text-zinc-400 leading-relaxed font-sans">
                  Sistemas antigos cospem relatórios em folhas A4 com tabelas pretas e cinzas que parecem planilhas de Excel mal formatadas. Suas ordens de serviço ficam perdidas em blocos de papel manchados de graxa. Essa falta de clareza gera desconfiança no cliente e atrasos na entrega dos veículos.
                </p>
              </div>
            </div>

            {/* CHAPTER 2 */}
            <div className="story-chapter grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 chapter-fade text-[10px] text-emerald-500 font-bold uppercase tracking-widest pt-1">
                [CAPÍTULO II: A RUPTURA]
              </div>
              <div className="md:col-span-3 space-y-4">
                <h2 className="chapter-fade text-xl md:text-2xl font-bold text-white uppercase tracking-tight font-mono">
                  Sua oficina merece uma experiência visual premium.
                </h2>
                <p className="chapter-fade text-xs md:text-sm text-zinc-400 leading-relaxed font-sans">
                  Acreditamos que o fechamento da Ordem de Serviço — o exato momento em que o cliente paga — precisa transmitir o mesmo nível de sofisticação que um Invoice corporativo de luxo. A comunicação deve ser direta, automatizada e transparente, elevando o posicionamento da sua oficina frente ao mercado.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* 3. BENTO GRID SECTION */}
        <section id="bento" className="bento-section relative z-10 py-24 border-b border-white/5">
          <div className="px-6 md:px-12 lg:px-24 mb-16 text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold font-mono">[TECNOLOGIA OPERACIONAL]</span>
            <h2 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-tight font-mono">
              O Pátio sob seu total controle
            </h2>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Integração completa de sensores de rampa, filas automatizadas e assistente WhatsApp para otimizar sua produtividade.
            </p>
          </div>

          <AnimatedBento />
        </section>

        {/* 4. PIN SHOWCASE: FLUXO DE O.S. CINEMÁTICO */}
        <section id="showcase" className="pin-section relative z-10 min-h-[200vh] border-b border-white/5 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 px-6 md:px-12 lg:px-24">
            
            {/* Left side pinned graphic */}
            <div className="h-[75vh] flex items-center justify-center">
              <div className="pin-showcase w-full max-w-md bg-zinc-950/70 border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 size-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header mock */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] uppercase tracking-widest text-zinc-300 font-bold">O.S. #2481</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 font-bold">EM ANDAMENTO</span>
                </div>

                {/* Details mock */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[8px] text-zinc-500 uppercase font-mono">Veículo</span>
                      <span className="text-[10px] text-white block font-bold font-mono">PORSCHE 911 CARREIRA</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] text-zinc-500 uppercase font-mono">Placa</span>
                      <span className="text-[10px] text-white block font-bold font-mono">KPR-9111</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-zinc-400">Revisão de Suspensão</span>
                      <span className="text-emerald-400 font-bold">R$ 1.890,00</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono border-t border-white/5 pt-2">
                      <span className="text-zinc-400">Troca de Óleo Mobil 1</span>
                      <span className="text-emerald-400 font-bold">R$ 550,00</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-[10px] text-zinc-400 uppercase font-mono">TOTAL ESTIMADO</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">R$ 2.440,00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side scrolling descriptions */}
            <div className="space-y-[60vh] py-32 z-10">
              
              <div className="space-y-4 max-w-md">
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">[ETAPA 01: ENTRADA]</div>
                <h3 className="text-xl font-bold text-white uppercase font-mono">Check-in fotográfico instantâneo</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Registre o estado do veículo, quilometragem, combustível e tire fotos de avarias direto pelo celular. O sistema gera a ficha de entrada com data de entrada do veículo automaticamente.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">[ETAPA 02: ORÇAMENTO]</div>
                <h3 className="text-xl font-bold text-white uppercase font-mono">Geração de orçamentos limpos</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Vincule peças do estoque e mão de obra de forma fluida. O cliente recebe um link exclusivo de visualização do orçamento com design de alto luxo e botões rápidos para aprovar ou rejeitar os serviços.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">[ETAPA 03: FECHAMENTO]</div>
                <h3 className="text-xl font-bold text-white uppercase font-mono">Faturamento e fone automatizado</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Ao concluir os reparos, envie a O.S. faturada em PDF de alto contraste pelo WhatsApp. O cliente confere os valores, efetua o pagamento Pix direto pela tela online via QR Code e assina digitalmente.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* 5. CTA SECTION */}
        <section className="relative z-10 px-6 py-32 text-center border-b border-white/5 bg-zinc-950/40">
          <div className="absolute inset-0 size-full bg-radial-gradient from-emerald-950/10 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-2xl mx-auto space-y-6">
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold font-mono">[PRONTO PARA A MUDANÇA?]</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter leading-none font-mono">
              DEPOIS DO PRIMEIRO DIA, <br />
              NÃO HÁ VOLTA.
            </h2>
            <p className="text-xs text-zinc-400 font-sans max-w-lg mx-auto leading-relaxed">
              Dê à sua oficina mecânica a eficiência e sofisticação de um grande centro tecnológico de serviços automotivos.
            </p>
            <div className="pt-4">
              <Link 
                href="/register" 
                className="inline-flex h-12 px-8 items-center gap-2 bg-emerald-500 text-zinc-950 font-bold uppercase text-xs hover:bg-emerald-400 transition-all rounded-none"
              >
                Cadastre sua Oficina Gratuitamente
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-10 py-12 px-6 md:px-12 border-t border-white/5 text-[9px] uppercase tracking-widest text-zinc-500 font-mono flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-950">
          <span>© {new Date().getFullYear()} KYPERFIX. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          </div>
        </footer>

      </div>
    </SmoothScroll>
  );
}
