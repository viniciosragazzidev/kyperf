"use client"

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import InteractiveBg from "@/components/landing/interactive-bg";
import SmoothScroll from "@/components/landing/smooth-scroll";
import AnimatedBento from "@/components/landing/animated-bento";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronRight,
  Database,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  HelpCircle,
  TrendingUp,
  Sliders,
  DollarSign,
  QrCode,
  FileCheck
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  // Typewriter effect for simulation terminal
  const [commandIndex, setCommandIndex] = useState(0);
  const [commandText, setCommandText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [connectedOficinas, setConnectedOficinas] = useState(4812);

  useEffect(() => {
    const commands = [
      'create_os --vehicle "GTI 2026" --plate "KPR-2026" --owner "Silva"',
      'dispatch_whatsapp --status "Approved" --id "wo_4812" --pdf "invoice.pdf"',
      'update_patio --box "03" --status "READY" --notify "customer"',
      'calculate_commissions --month "June" --rate "12.5%" --generate_payout'
    ];

    let timer: any;
    const currentFullText = commands[commandIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setCommandText(prev => prev.slice(0, -1));
      }, 25);
    } else {
      timer = setTimeout(() => {
        setCommandText(currentFullText.slice(0, commandText.length + 1));
      }, 50);
    }

    if (!isDeleting && commandText === currentFullText) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000); 
    } else if (isDeleting && commandText === "") {
      setIsDeleting(false);
      setCommandIndex(prev => (prev + 1) % commands.length);
    }

    return () => clearTimeout(timer);
  }, [commandText, isDeleting, commandIndex]);

  // Simulated live stats counter
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectedOficinas(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 1. Reveal animations for hero elements
    const heroElements = gsap.utils.toArray(".hero-reveal");
    gsap.fromTo(heroElements, 
      { opacity: 0, y: 25 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1, 
        stagger: 0.08, 
        ease: "power4.out",
        delay: 0.1
      }
    );

    // 2. Storytelling chapters scroll animations
    const chapters = gsap.utils.toArray(".story-chapter");
    chapters.forEach((chapter: any) => {
      gsap.fromTo(chapter.querySelectorAll(".chapter-fade"),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: chapter,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // 3. Showcase 3D tilt/rotation (CSS sticky handles positioning)
    const pinShowcase = document.querySelector(".pin-showcase");
    const showcaseSection = document.getElementById("showcase");
    if (showcaseSection && pinShowcase) {
      // 3D tilt effect on scroll
      gsap.fromTo(pinShowcase, 
        { scale: 0.9, rotateX: -10, rotateY: 12, transformPerspective: 1000 },
        {
          scale: 1.02,
          rotateX: 6,
          rotateY: -6,
          scrollTrigger: {
            trigger: showcaseSection,
            start: "top 30%",
            end: "bottom 70%",
            scrub: true,
          }
        }
      );

      // Dynamic active steps synced to scrolling text targets
      const stepTriggers = gsap.utils.toArray(".step-trigger");
      stepTriggers.forEach((trigger: any, idx: number) => {
        ScrollTrigger.create({
          trigger: trigger,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () => setActiveStep(idx + 1),
          onEnterBack: () => setActiveStep(idx + 1),
        });
      });
    }

    // 4. Smooth background color shifts on scroll
    gsap.to(".color-overlay", {
      backgroundColor: "rgba(4, 33, 24, 0.45)", 
      scrollTrigger: {
        trigger: ".bento-section",
        start: "top 55%",
        end: "bottom 30%",
        scrub: true
      }
    });

    // 5. Fade-in for key modules
    gsap.fromTo(".module-card", 
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.7, 
        stagger: 0.08, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".modules-grid",
          start: "top 80%",
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => (prev === idx ? null : idx));
  };

  return (
    <SmoothScroll>
      <div ref={containerRef} className="relative min-h-screen text-zinc-300 font-mono bg-zinc-950 overflow-hidden selection:bg-emerald-500/30 selection:text-white">
        
        {/* Dynamic WebGL fluid texture background */}
        <InteractiveBg />

        {/* Global ambient noise & grid line overlays */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.035]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        
        {/* Laser scanning animations traversing the grid lines */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[25vh] left-0 w-full laser-line-h" />
          <div className="absolute top-[65vh] left-0 w-full laser-line-h animation-delay-4000" />
          <div className="absolute top-0 left-[20vw] h-full laser-line-v" />
          <div className="absolute top-0 left-[80vw] h-full laser-line-v animation-delay-2000" />
        </div>
        
        <style jsx global>{`
          @keyframes scanH {
            0% { left: -50%; opacity: 0; }
            15% { opacity: 0.6; }
            85% { opacity: 0.6; }
            100% { left: 150%; opacity: 0; }
          }
          @keyframes scanV {
            0% { top: -50%; opacity: 0; }
            15% { opacity: 0.6; }
            85% { opacity: 0.6; }
            100% { top: 150%; opacity: 0; }
          }
          .laser-line-h {
            height: 1px;
            width: 300px;
            background: linear-gradient(to right, transparent, #059669, #10b981, #059669, transparent);
            position: absolute;
            animation: scanH 10s linear infinite;
          }
          .laser-line-v {
            width: 1px;
            height: 300px;
            background: linear-gradient(to bottom, transparent, #059669, #10b981, #059669, transparent);
            position: absolute;
            animation: scanV 14s linear infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>

        {/* Dynamic color shifting overlay on scroll */}
        <div className="color-overlay fixed inset-0 z-0 bg-transparent pointer-events-none transition-colors duration-1000 ease-out" />

        {/* TOP HEADER */}
        <header className="relative z-50 w-full border-b border-white/5 bg-zinc-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={ToolsIcon} strokeWidth={2} className="size-5 text-emerald-500 shrink-0 animate-spin-slow" />
            <span className="text-sm font-bold tracking-widest text-white uppercase">KYPERFIX</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-zinc-400">
            <a href="#story" className="hover:text-emerald-400 transition-colors">[ O_Manifesto ]</a>
            <a href="#bento" className="hover:text-emerald-400 transition-colors">[ Tecnologia ]</a>
            <a href="#modules" className="hover:text-emerald-400 transition-colors">[ Modulos ]</a>
            <a href="#showcase" className="hover:text-emerald-400 transition-colors">[ Fluxo_OS ]</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">[ Suporte ]</a>
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
        <section ref={heroRef} className="relative z-10 min-h-[75vh] flex flex-col justify-center px-6 md:px-12 lg:px-24 py-12 border-b border-white/5">
          {/* Engineering-like float metadata coordinates */}
          <div className="absolute top-6 left-8 hidden lg:block text-[8px] text-zinc-650 tracking-widest uppercase space-y-1">
            <div>[SYS_LOC: PANEL/ROOT_MAIN]</div>
            <div>[COORD: 22.9068° S, 43.1729° W]</div>
            <div className="text-zinc-700">[VER: V0.1.0_PROD]</div>
          </div>

          <div className="absolute top-6 right-8 hidden lg:block text-[8px] text-emerald-500/40 tracking-widest uppercase text-right space-y-1">
            <div>[STATUS: SYSTEM_ONLINE]</div>
            <div>[ENGINE: WEBGL_OGL_CORE]</div>
            <div className="text-emerald-500/60 font-bold">[PING: 14MS]</div>
          </div>

          {/* Centered Floating Badge */}
          <div className="hero-reveal inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest text-emerald-400 font-bold max-w-fit mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SaaS Operacional Premium para Oficinas Mecânicas
          </div>

          {/* Compacted Monospace Titles */}
          <h1 className="hero-reveal text-3xl md:text-5xl lg:text-6xl font-bold text-white uppercase tracking-tighter leading-none max-w-4xl">
            A EVOLUÇÃO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 font-mono">DE HAUTE COUTURE</span> <br />
            DO SEU PÁTIO.
          </h1>

          <p className="hero-reveal text-xs md:text-sm text-zinc-400 max-w-2.2xl mt-4 tracking-wide leading-relaxed font-sans dark:text-zinc-400">
            Esqueça os relatórios cinzas do Windows 95 e planilhas riscadas de óleo. O KYPERFIX redesenha a gestão da sua oficina com controle em tempo real, disparos automáticos de WhatsApp e relatórios que respiram profissionalismo.
          </p>

          {/* Live Command Terminal Mockup */}
          <div className="hero-reveal mt-6 w-full max-w-lg bg-black/70 border border-white/5 rounded-2xl p-3.5 font-mono text-[11px] shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
              </div>
              <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-bold">TERMINAL DE COMANDO MOCK</span>
            </div>
            <div className="space-y-1 text-zinc-400">
              <div className="flex items-center gap-1">
                <span className="text-emerald-500 font-bold">kyperfix@user:~$</span>
                <span>{commandText}</span>
                <span className="w-1.5 h-3.5 bg-emerald-400 animate-pulse inline-block align-middle ml-0.5" />
              </div>
            </div>
          </div>

          {/* Telemetry Hero Stats */}
          <div className="hero-reveal mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3.5xl border-t border-white/5 pt-6">
            <div className="space-y-0.5">
              <span className="text-[7px] text-zinc-500 uppercase tracking-wider block font-bold">[OFICINAS_CONECTADAS]</span>
              <span className="text-base md:text-xl font-bold text-white font-mono">{connectedOficinas.toLocaleString()}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[7px] text-zinc-500 uppercase tracking-wider block font-bold">[MÉDIA_DE_MENSAGENS_BOT]</span>
              <span className="text-base md:text-xl font-bold text-emerald-400 font-mono">+940K/MÊS</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[7px] text-zinc-500 uppercase tracking-wider block font-bold">[FATURAMENTO_MÉDIO]</span>
              <span className="text-base md:text-xl font-bold text-white font-mono">+32.4% ANUAL</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[7px] text-zinc-500 uppercase tracking-wider block font-bold">[COMMITTED_UPTIME]</span>
              <span className="text-base md:text-xl font-bold text-emerald-500 font-mono">99.98% OK</span>
            </div>
          </div>

          <div className="hero-reveal flex flex-wrap gap-4 mt-8">
            <Link 
              href="/register" 
              className="h-11 px-5 flex items-center gap-2 bg-emerald-500 text-zinc-950 font-bold uppercase text-xs hover:bg-emerald-400 transition-all rounded-none"
            >
              Fazer Cadastro da Oficina
              <ArrowRight className="size-4" />
            </Link>
            <Link 
              href="#story" 
              className="h-11 px-5 flex items-center justify-center border border-white/10 text-zinc-300 font-bold uppercase text-xs hover:bg-white/5 transition-all rounded-none"
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
              <div className="md:col-span-1 chapter-fade text-[10px] text-emerald-500 font-bold uppercase tracking-widest pt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                [CAPÍTULO I: O ANACRONISMO]
              </div>
              <div className="md:col-span-3 space-y-4">
                <h2 className="chapter-fade text-xl md:text-2xl font-bold text-white uppercase tracking-tight font-mono">
                  O erro clássico dos sistemas antigos.
                </h2>
                <p className="chapter-fade text-xs md:text-sm text-zinc-400 leading-relaxed font-sans">
                  Sistemas antigos cospem relatórios em folhas A4 com tabelas pretas e cinzas que parecem planilhas de Excel mal formatadas. Suas ordens de serviço ficam perdidas in blocos de papel manchados de graxa. Essa falta de clareza gera desconfiança no cliente e atrasos na entrega dos veículos.
                </p>
              </div>
            </div>

            {/* CHAPTER 2 */}
            <div className="story-chapter grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 chapter-fade text-[10px] text-emerald-500 font-bold uppercase tracking-widest pt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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

        {/* 4. CORE MODULES GRID SECTION */}
        <section id="modules" className="relative z-10 py-28 border-b border-white/5 bg-zinc-950/20">
          <div className="px-6 md:px-12 lg:px-24 mb-20 text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold font-mono">[MÓDULOS_DO_NÚCLEO]</span>
            <h2 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-tight font-mono">
              Recursos construídos para Alta Performance
            </h2>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Cada engrenagem do KYPERFIX foi planejada para substituir a papelada por workflows inteligentes de alta velocidade.
            </p>
          </div>

          <div className="modules-grid max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: Sliders, 
                title: "Agendamento & Fluxo", 
                desc: "Controle visual de rampas de serviço e box de mecânicos. Priorização automática baseada na data de entrega." 
              },
              { 
                icon: DollarSign, 
                title: "Financeiro & Comissão", 
                desc: "Cálculo instantâneo de comissão por mecânico ao fechar O.S., com controle de caixa e relatórios mensais." 
              },
              { 
                icon: Database, 
                title: "Inventário de Peças", 
                desc: "Controle de estoque mínimo com alertas inteligentes e cadastro de fornecedores para reabastecimento rápido." 
              },
              { 
                icon: Cpu, 
                title: "WhatsApp Inteligente", 
                desc: "Geração e disparo automático de orçamentos e termos de garantia em PDF direto para o WhatsApp do cliente." 
              },
              { 
                icon: Smartphone, 
                title: "Assinatura Digital", 
                desc: "Aceite formal de ordens de serviço e termos de diagnóstico assinados pelo cliente na tela do celular." 
              },
              { 
                icon: ShieldCheck, 
                title: "Multi-tenant Seguro", 
                desc: "Gerencie filiais e oficinas diferentes a partir do mesmo painel principal, com caixas e funcionários separados." 
              }
            ].map((mod, idx) => (
              <div key={idx} className="module-card bg-zinc-950/50 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/20 transition-all duration-300 space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded-2xl max-w-fit">
                  <mod.icon className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 font-mono uppercase tracking-wider">{mod.title}</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. PIN SHOWCASE: FLUXO DE O.S. CINEMÁTICO (WITH CSS STICKY TO SOLVE GSAP GRID BREAKING) */}
        <section id="showcase" className="relative z-10 border-b border-white/5 py-20 bg-zinc-950/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 px-6 md:px-12 lg:px-24 items-start">
            
            {/* Left side pinned graphic (Sticky via CSS) */}
            <div className="lg:sticky lg:top-[20vh] w-full flex items-center justify-center py-12 z-20">
              <div className="pin-showcase w-full max-w-md bg-zinc-950/70 border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-[330px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 size-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <AnimatePresence mode="wait">
                  {activeStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col justify-between"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] uppercase tracking-widest text-zinc-300 font-bold">O.S. #2481 ➜ CHECK-IN</span>
                        </div>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 font-bold">PÁTIO / RECEBIDO</span>
                      </div>

                      {/* Content */}
                      <div className="space-y-3 flex-1 justify-center flex flex-col">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-zinc-500 uppercase font-mono">Veículo</span>
                            <span className="text-[10px] text-white block font-bold font-mono">PORSCHE 911 CARREIRA</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-zinc-500 uppercase font-mono">Placa / KM</span>
                            <span className="text-[10px] text-white block font-bold font-mono">KPR-9111 / 12.450km</span>
                          </div>
                        </div>

                        {/* Checklist */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 space-y-1.5 text-[9px] font-mono">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <span>✓</span> <span>Nível do óleo verificado</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <span>✓</span> <span>Combustível marcado: 3/4</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500">
                            <span>✗</span> <span>Avaria: Risco roda traseira dir.</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                        <span className="text-[8px] text-zinc-500 uppercase font-mono">REGISTRADO POR</span>
                        <span className="text-[9px] font-bold font-mono text-zinc-300">RECEPCAO_MATRIZ</span>
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col justify-between"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-[9px] uppercase tracking-widest text-zinc-300 font-bold">O.S. #2481 ➜ ORÇAMENTO</span>
                        </div>
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 font-bold">AGUARDANDO APROVAÇÃO</span>
                      </div>

                      {/* Content */}
                      <div className="space-y-2.5 flex-1 justify-center flex flex-col">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-[9px] font-mono">
                            <span className="text-zinc-400">Revisão de Suspensão</span>
                            <span className="text-emerald-400 font-bold">R$ 1.890,00</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-mono border-t border-white/5 pt-1.5">
                            <span className="text-zinc-400">Troca de Óleo Mobil 1</span>
                            <span className="text-emerald-400 font-bold">R$ 550,00</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-mono border-t border-white/5 pt-1.5">
                            <span className="text-zinc-400">Pastilhas de Freio Brembo</span>
                            <span className="text-amber-400 font-bold">R$ 1.200,00</span>
                          </div>
                        </div>

                        {/* Interactive Buttons mockup */}
                        <div className="grid grid-cols-2 gap-2">
                          <button className="h-8 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] uppercase tracking-wider font-bold hover:bg-emerald-500/20 transition-all rounded-xl">
                            ✓ Aprovar Todos
                          </button>
                          <button className="h-8 bg-red-500/15 border border-red-500/30 text-red-400 text-[8px] uppercase tracking-wider font-bold hover:bg-red-500/20 transition-all rounded-xl">
                            ✗ Rejeitar Item
                          </button>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                        <span className="text-[8px] text-zinc-500 uppercase font-mono">VALOR TOTAL ORÇADO</span>
                        <span className="text-sm font-bold font-mono text-emerald-400">R$ 3.640,00</span>
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col justify-between"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-[9px] uppercase tracking-widest text-zinc-300 font-bold">O.S. #2481 ➜ INVOICE</span>
                        </div>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 font-bold">✓ PAGO via PIX</span>
                      </div>

                      {/* Content */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* QR Code mock */}
                        <div className="bg-white/5 border border-white/10 p-2 rounded-xl flex items-center justify-center shrink-0">
                          <QrCode className="size-16 text-emerald-400" />
                        </div>
                        
                        <div className="space-y-2 flex-1">
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-zinc-500 uppercase font-mono block">Status do Pagamento</span>
                            <span className="text-[9px] text-emerald-400 block font-bold font-mono uppercase">CONTA LIQUIDADA</span>
                          </div>
                          
                          {/* Assinatura Digital mockup */}
                          <div className="border-t border-white/5 pt-2">
                            <span className="text-[7px] text-zinc-500 uppercase font-mono block">Assinatura do Cliente</span>
                            <span className="text-xs font-serif text-zinc-300 italic tracking-wider mt-0.5 block font-bold">Duarte Silva</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                        <span className="text-[8px] text-zinc-500 uppercase font-mono">MÉTODO</span>
                        <span className="text-[10px] font-bold font-mono text-white">PIX DIRETO</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right side scrolling descriptions with spaced layouts */}
            <div className="z-10 pb-[30vh]">
              
              <div className="step-trigger space-y-4 max-w-md">
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">[ETAPA 01: ENTRADA]</div>
                <h3 className="text-xl font-bold text-white uppercase font-mono">Check-in fotográfico instantâneo</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Registre o estado do veículo, quilometragem, combustível e tire fotos de avarias direto pelo celular. O sistema gera a ficha de entrada com data de entrada do veículo automaticamente.
                </p>
              </div>

              <div className="step-trigger space-y-4 max-w-md pt-[45vh]">
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">[ETAPA 02: ORÇAMENTO]</div>
                <h3 className="text-xl font-bold text-white uppercase font-mono">Geração de orçamentos limpos</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Vincule peças do estoque e mão de obra de forma fluida. O cliente recebe um link exclusivo de visualização do orçamento com design de alto luxo e botões rápidos para aprovar ou rejeitar os serviços.
                </p>
              </div>

              <div className="step-trigger space-y-4 max-w-md pt-[45vh]">
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">[ETAPA 03: FECHAMENTO]</div>
                <h3 className="text-xl font-bold text-white uppercase font-mono">Faturamento e fone automatizado</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Ao concluir os reparos, envie a O.S. faturada em PDF de alto contraste pelo WhatsApp. O cliente confere os valores, efetua o pagamento Pix direto pela tela online via QR Code e assina digitalmente.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* 6. FAQ SECTION */}
        <section id="faq" className="relative z-10 px-6 md:px-12 lg:px-24 py-28 border-b border-white/5 bg-zinc-950/40">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold font-mono">[PERGUNTAS_FREQUENTES]</span>
              <h2 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-tight font-mono">
                Dúvidas Técnicas Resolvidas
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Como funciona o bot do WhatsApp? Preciso deixar o celular ligado?",
                  a: "Não é necessário. O bot do KYPERFIX roda baseado em nossa infraestrutura na nuvem conectada ao OpenWA. Uma vez que você realize a conexão por QR Code uma única vez, o sistema continuará disparando PDFs e notificações automaticamente 24 horas por dia, 7 dias por semana, mesmo que seu aparelho esteja desligado ou sem bateria."
                },
                {
                  q: "O KYPERFIX suporta mais de uma filial/oficina?",
                  a: "Sim, a plataforma foi desenvolvida desde o início para ser multi-tenant e multi-filial. Você pode cadastrar e controlar diferentes unidades sob uma mesma conta empresarial, com gerenciamento individualizado de caixas financeiros, comissões de mecânicos locais e estoque de peças específico por oficina."
                },
                {
                  q: "Como é calculado a comissão dos mecânicos?",
                  a: "Você pode definir uma taxa percentual de comissão individual para cada funcionário (ex: 30% em serviços). Toda vez que uma Ordem de Serviço é fechada com o status PAID, o sistema contabiliza e separa os valores automaticamente. Os dados são agrupados em um relatório consolidado na aba Financeiro ➜ Comissões."
                },
                {
                  q: "Os dados de demonstração afetam minhas ordens reais?",
                  a: "Absolutamente não. O Modo Demo do KYPERFIX é executado e mantido no localStorage e estado local da sua máquina. Ele serve puramente como simulação interativa de primeiro acesso para visualização rápida das telas operacionais (Tabela e Kanban) sem contaminar ou alterar as tabelas do seu banco de dados real."
                }
              ].map((faq, idx) => (
                <div key={idx} className="bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => toggleFaq(idx)} 
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-mono text-xs md:text-sm font-bold text-zinc-150 hover:bg-white/5 transition-all uppercase tracking-wider"
                  >
                    <span>{faq.q}</span>
                    {openFaq === idx ? <ChevronUp className="size-4 text-emerald-500" /> : <ChevronDown className="size-4 text-zinc-500" />}
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-6 pt-2 font-sans text-xs text-zinc-400 leading-relaxed border-t border-white/5 bg-zinc-900/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. CTA SECTION */}
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

        {/* FLOATING WHATSAPP BOT STATUS */}
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950/80 border border-emerald-500/25 px-3.5 py-2 flex items-center gap-2.5 backdrop-blur-md shadow-2xl rounded-full">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[8px] tracking-widest font-mono text-emerald-400 uppercase font-bold">WA_BOT: ACTIVE</span>
        </div>

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
