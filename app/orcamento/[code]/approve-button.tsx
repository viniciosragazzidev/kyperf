"use client"

import { useState, useTransition } from "react";
import { approveLiteBudgetAction } from "@/lib/actions/lite-actions";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ApproveButton({ code, total }: { code: string; total: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const handleApprove = () => {
    startTransition(async () => {
      const r = await approveLiteBudgetAction(code);
      if (r.success) setDone(true);
    });
  };

  if (done) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <p className="text-2xl font-black text-[#065f46]">Aprovado!</p>
        <p className="text-gray-600 text-lg mt-2">A oficina já recebeu sua aprovação.</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isPending}
      className="w-full bg-[#065f46] text-white rounded-3xl py-7 text-2xl font-black
                 hover:bg-[#047857] active:scale-[0.98] transition-all
                 flex items-center justify-center gap-3 shadow-2xl
                 disabled:opacity-60"
    >
      {isPending
        ? <><Loader2 className="size-8 animate-spin" /> Aprovando...</>
        : <><CheckCircle2 className="size-8" /> APROVAR E INICIAR SERVIÇO</>
      }
    </button>
  );
}
