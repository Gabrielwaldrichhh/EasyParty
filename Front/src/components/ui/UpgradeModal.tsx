import { X, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { billingService } from "../../services/billingService";
import { useState } from "react";

interface Props {
  onClose: () => void;
}

export function UpgradeModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleAssinar() {
    setLoading(true);
    try {
      await billingService.startProSubscription();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-50 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Topo gradiente */}
        <div
          className="px-6 pt-6 pb-5 text-white relative"
          style={{ background: 'linear-gradient(135deg, #ee2525 0%, #f5711a 100%)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold">Upgrade para o Pro</h2>
          <p className="text-white/80 text-sm mt-0.5">
            Você atingiu o limite do plano gratuito.
          </p>
        </div>

        {/* Benefícios */}
        <div className="px-6 py-4 flex flex-col gap-2.5">
          {[
            'Eventos ilimitados ativos',
            '5 boosts de destaque por mês',
            'Analytics em tempo real',
            'Suporte prioritário',
          ].map(item => (
            <div key={item} className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#ee2525' }} />
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}

          <div className="mt-1 p-3 rounded-xl bg-muted/60 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-bold text-foreground text-base">R$ 29,99</span>/mês
              {' · '}
              <span className="text-green-600 font-semibold">7 dias grátis</span>
              {' · '} Cancele quando quiser
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="px-6 pb-5 flex flex-col gap-2">
          <button
            onClick={handleAssinar}
            disabled={loading}
            className="w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #ee2525, #f5711a)' }}
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <> Começar 7 dias grátis <ArrowRight className="w-4 h-4" /> </>
            }
          </button>
          <button
            onClick={onClose}
            className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Continuar no plano gratuito
          </button>
        </div>
      </div>
    </div>
  );
}
