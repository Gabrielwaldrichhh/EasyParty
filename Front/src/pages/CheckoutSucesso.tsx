import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Zap, Rocket } from "lucide-react";

const PLAN_LABELS: Record<string, { label: string; cor: string }> = {
  pro:   { label: 'Pro',   cor: '#8b5cf6' },
  elite: { label: 'Elite', cor: '#f59e0b' },
};

export function CheckoutSucesso() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plan   = params.get('plan');
  const boost  = params.get('boost');

  useEffect(() => {
    // Limpa dados do usuário no localStorage para forçar re-fetch do plano
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (plan) u.stripePlan = plan;
        localStorage.setItem('user', JSON.stringify(u));
      } catch {}
    }
    const t = setTimeout(() => navigate('/'), 5000);
    return () => clearTimeout(t);
  }, [plan, boost, navigate]);

  const isBoost = !!boost;
  const planInfo = plan ? PLAN_LABELS[plan] : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #ee252510, #fdbb2d10)' }}>
      <div className="bg-background border border-border rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center flex flex-col items-center gap-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: isBoost ? '#ee252520' : planInfo ? planInfo.cor + '20' : '#10b98120' }}
        >
          {isBoost
            ? <Rocket className="w-9 h-9" style={{ color: '#ee2525' }} />
            : <Zap className="w-9 h-9" style={{ color: planInfo?.cor ?? '#10b981' }} />
          }
        </div>

        <div>
          <p className="text-2xl font-bold text-foreground mb-1">
            {isBoost ? 'Evento turbinado!' : `Plano ${planInfo?.label ?? ''} ativado!`}
          </p>
          <p className="text-sm text-muted-foreground">
            {isBoost
              ? 'Seu evento ficará em destaque no mapa por 7 dias.'
              : 'Suas novas funcionalidades já estão disponíveis.'
            }
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Redirecionando em 5 segundos...
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full h-10 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #ee2525, #fdbb2d)' }}
        >
          Ir para o mapa agora
        </button>
      </div>
    </div>
  );
}
