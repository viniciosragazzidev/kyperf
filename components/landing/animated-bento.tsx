"use client"

import { useState, useEffect } from "react";
import { 
  Wrench, 
  MessageSquareCode, 
  Cpu, 
  Activity, 
  Compass, 
  UserCheck, 
  UserX,
  Gauge as GaugeIcon
} from "lucide-react";

export default function AnimatedBento() {
  const [toggle1, setToggle1] = useState(true);
  const [toggle2, setToggle2] = useState(false);
  const [toggle3, setToggle3] = useState(true);
  const [gaugeVal, setGaugeVal] = useState(0);

  // Simulated live state changes
  useEffect(() => {
    const toggleInterval = setInterval(() => {
      setToggle1(prev => !prev);
      setToggle2(prev => !prev);
    }, 3000);

    const toggleInterval2 = setInterval(() => {
      setToggle3(prev => !prev);
    }, 4500);

    // Simulated gauge value fluctuation (representing busy workshop bays)
    const gaugeInterval = setInterval(() => {
      setGaugeVal(prev => {
        const next = prev + (Math.random() > 0.5 ? 5 : -5);
        return Math.max(40, Math.min(next, 95));
      });
    }, 2000);
    setGaugeVal(75); // Initial state

    return () => {
      clearInterval(toggleInterval);
      clearInterval(toggleInterval2);
      clearInterval(gaugeInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      {/* Styles local inject for complex pure CSS keyframe animations */}
      <style jsx global>{`
        @keyframes drawRoadmap {
          0% { stroke-dashoffset: 1000; }
          40% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes floatBubble1 {
          0% { transform: translateY(30px) scale(0.85); opacity: 0; }
          15% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-110px) scale(1); opacity: 0; }
        }
        @keyframes floatBubble2 {
          0% { transform: translateY(30px) scale(0.85); opacity: 0; }
          15% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-130px) scale(1); opacity: 0; }
        }
        @keyframes floatBubble3 {
          0% { transform: translateY(30px) scale(0.85); opacity: 0; }
          15% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-120px) scale(1); opacity: 0; }
        }
        @keyframes pulseEnvelope {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .roadmap-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawRoadmap 10s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .bubble-animate-1 {
          animation: floatBubble1 6s infinite ease-in-out;
        }
        .bubble-animate-2 {
          animation: floatBubble2 6s infinite ease-in-out;
          animation-delay: 2s;
        }
        .bubble-animate-3 {
          animation: floatBubble3 6s infinite ease-in-out;
          animation-delay: 4s;
        }
        .envelope-pulse {
          animation: pulseEnvelope 4s infinite ease-in-out;
        }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px] md:auto-rows-[200px]">
        
        {/* CARD 1: OS Roadmap Autodesenhante (col-span 2) */}
        <div className="md:col-span-2 row-span-2 bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative group hover:border-emerald-500/10 transition-all duration-500">
          <div className="absolute top-0 right-0 size-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Compass className="size-5 text-emerald-500" />
              <span className="text-xs uppercase tracking-widest font-mono text-zinc-300 font-bold">Rastreamento de Processo Real-Time</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auto-Desenho Ativo
            </div>
          </div>

          {/* SVG Roadmap Drawing Itself */}
          <div className="w-full h-36 flex items-center justify-center relative my-4 z-10">
            <svg viewBox="0 0 600 120" className="w-full h-full">
              {/* Background trace line */}
              <path 
                d="M 50 60 Q 175 10, 300 60 T 550 60" 
                fill="none" 
                stroke="rgba(255,255,255,0.03)" 
                strokeWidth="4" 
              />
              {/* Dynamic drawing line */}
              <path 
                d="M 50 60 Q 175 10, 300 60 T 550 60" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="4" 
                className="roadmap-path"
                strokeLinecap="round"
              />

              {/* Steps indicators */}
              {[
                { cx: 50, cy: 60, label: "Check-in", delay: "0s" },
                { cx: 175, cy: 35, label: "Orçamento", delay: "2s" },
                { cx: 300, cy: 60, label: "Execução", delay: "4s" },
                { cx: 425, cy: 85, label: "Teste final", delay: "6s" },
                { cx: 550, cy: 60, label: "Entregue", delay: "8s" }
              ].map((step, idx) => (
                <g key={idx} className="group/node">
                  <circle 
                    cx={step.cx} 
                    cy={step.cy} 
                    r="8" 
                    fill="#09090b" 
                    stroke="rgba(255,255,255,0.1)" 
                    strokeWidth="2" 
                    className="transition-all duration-300 group-hover/node:stroke-emerald-400"
                  />
                  <circle 
                    cx={step.cx} 
                    cy={step.cy} 
                    r="4" 
                    fill="#10b981" 
                    className="animate-pulse"
                  />
                  <text 
                    x={step.cx} 
                    y={step.cy - 16} 
                    textAnchor="middle" 
                    fill="#a1a1aa" 
                    fontSize="9" 
                    fontFamily="monospace"
                    className="uppercase tracking-widest font-bold fill-zinc-400 group-hover/node:fill-emerald-400 transition-colors"
                  >
                    {step.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="z-10">
            <h3 className="text-sm font-bold text-zinc-100 font-mono">Linha do Tempo Inteligente</h3>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-md">
              Do check-in à entrega. O cliente assiste à evolução visual de cada reparo em tempo real, sem precisar ligar para a recepção.
            </p>
          </div>
        </div>

        {/* CARD 2: Disparo de Mensagens WhatsApp (col-span 1, row-span 2) */}
        <div className="md:col-span-1 row-span-2 bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative group hover:border-emerald-500/10 transition-all duration-500">
          <div className="absolute top-0 left-0 size-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <MessageSquareCode className="size-5 text-emerald-500" />
              <span className="text-xs uppercase tracking-widest font-mono text-zinc-300 font-bold">Automação WhatsApp</span>
            </div>
          </div>

          {/* Messages Flying Out of Envelope */}
          <div className="w-full h-44 flex items-center justify-center relative my-4 z-10">
            {/* Envelope 3D / CSS */}
            <div className="absolute bottom-4 z-20 w-24 h-16 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl flex items-center justify-center envelope-pulse">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-850 to-zinc-900 opacity-80 rounded-lg" />
              {/* Envelope flap */}
              <div className="absolute -top-6 left-0 right-0 h-6 bg-zinc-900 border-x border-t border-zinc-800 rounded-t-full origin-bottom transform rotate-x-180 opacity-50" />
              <div className="absolute top-2 w-10 h-0.5 bg-emerald-500/30 rounded-full" />
              <span className="text-[9px] font-mono text-emerald-500 font-bold tracking-widest">BOT ACTIVE</span>
            </div>

            {/* Chat Bubbles */}
            <div className="absolute bottom-16 w-full flex flex-col items-center pointer-events-none">
              {/* Bubble 1 */}
              <div className="absolute bubble-animate-1 bg-emerald-950/80 border border-emerald-500/20 rounded-2xl px-3 py-1.5 max-w-[140px] text-center shadow-lg">
                <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase tracking-tighter">O.S. Criada!</span>
                <span className="text-[8px] text-zinc-300 font-mono">Golf GTI #1024</span>
              </div>
              {/* Bubble 2 */}
              <div className="absolute bubble-animate-2 bg-zinc-900/90 border border-white/5 rounded-2xl px-3 py-1.5 max-w-[150px] text-center shadow-lg">
                <span className="text-[9px] font-mono text-zinc-200 font-bold block uppercase tracking-tighter">Orçamento Aprovado</span>
                <span className="text-[8px] text-zinc-400 font-mono">Civic 2.0 - Pix OK!</span>
              </div>
              {/* Bubble 3 */}
              <div className="absolute bubble-animate-3 bg-emerald-950/85 border border-emerald-500/30 rounded-2xl px-3 py-1.5 max-w-[140px] text-center shadow-lg">
                <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase tracking-tighter">Pronto para Retirada</span>
                <span className="text-[8px] text-zinc-200 font-mono">Uno 1.0 - Box 02</span>
              </div>
            </div>
          </div>

          <div className="z-10">
            <h3 className="text-sm font-bold text-zinc-100 font-mono">Mensagens Instantâneas</h3>
            <p className="text-[11px] text-zinc-400 mt-1">
              O bot do WhatsApp dispara relatórios premium e PDFs automáticos sem que você precise abrir o WhatsApp Web.
            </p>
          </div>
        </div>

        {/* CARD 3: Live Feature Toggles (col-span 1) */}
        <div className="md:col-span-1 bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 flex flex-col justify-between overflow-hidden relative group hover:border-emerald-500/10 transition-all duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-emerald-500" />
              <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-300 font-bold">Controle do Pátio</span>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono uppercase">Mecânicos</span>
          </div>

          {/* Toggle Controls List with Signal Pulse */}
          <div className="space-y-2.5 my-2">
            {[
              { name: "Mecânico Carlos", active: toggle1 },
              { name: "Mecânico André", active: toggle2 },
              { name: "Mecânico Pedro", active: toggle3 }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-zinc-900/50 border border-white/5 rounded-xl px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    {item.active ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-650"></span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-300 font-bold">{item.name}</span>
                </div>
                {/* Switch indicator */}
                <div 
                  className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
                    item.active ? "bg-emerald-500" : "bg-zinc-800"
                  }`}
                >
                  <div 
                    className={`bg-zinc-950 w-3 h-3 rounded-full transition-transform duration-300 ${
                      item.active ? "translate-x-3" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-zinc-400 font-mono">
            Sinalização ativa com atualização automática de box.
          </div>
        </div>

        {/* CARD 4: Medidor de Capacidade / Gauge (col-span 2) */}
        <div className="md:col-span-2 bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 flex flex-col justify-between overflow-hidden relative group hover:border-emerald-500/10 transition-all duration-500">
          <div className="absolute top-0 right-0 size-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GaugeIcon className="size-4 text-emerald-500" />
              <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-300 font-bold">Ocupação dos Boxes de Rampa</span>
            </div>
            <span className="text-[9px] text-emerald-400 font-mono uppercase font-bold">Live Sensor</span>
          </div>

          <div className="flex items-center gap-6 my-1">
            {/* SVG Circular Gauge Fill */}
            <div className="relative size-20 shrink-0">
              <svg viewBox="0 0 100 100" className="size-full transform -rotate-90">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="rgba(255,255,255,0.03)" 
                  strokeWidth="8" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#10b981" 
                  strokeWidth="8" 
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * gaugeVal) / 100}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              {/* Central text indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-mono font-bold text-zinc-100">{gaugeVal}%</span>
                <span className="text-[6px] text-zinc-500 uppercase tracking-widest font-mono">Bays</span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-200 font-mono">Ocupação Inteligente</h4>
              <p className="text-[10px] text-zinc-400 max-w-sm">
                Sensores de rampa informam quais boxes estão livres para check-in instantâneo, otimizando o fluxo de veículos e o cronograma de entrega.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-mono uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Capacidade da Oficina Otimizada em 45%
          </div>
        </div>

      </div>
    </div>
  );
}
