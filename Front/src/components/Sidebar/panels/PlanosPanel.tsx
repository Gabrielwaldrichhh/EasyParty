import { useEffect, useState } from "react";
import { Check, Zap, Rocket, Lock, Loader2, Settings, RefreshCw } from "lucide-react";
import { billingService, type BillingStatus } from "../../../services/billingService";
import { authService } from "../../../services/authService";

// ─── Boost Avulso ─────────────────────────────────────────────────────────────

function BoostAvulsoCard({ onComprar, loading }: { onComprar: () => void; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-3" style={{ background: '#ee252512' }}>
        <div className="flex items-center gap-2 mb-1" style={{ color: '#ee2525' }}>
          <Rocket className="w-5 h-5" />
          <span className="text-sm font-bold">Turbinar Evento</span>
          <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#ee2525' }}>
            Avulso
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Pague uma vez e destaque um evento específico no mapa por 7 dias.
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">R$ 9,99</span>
          <span className="text-xs text-muted-foreground">pagamento único</span>
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-1.5">
        {[
          'Marcador destacado e animado no mapa',
          'Aparece no topo da lista "Para você"',
          'Badge "Em destaque" no card do evento',
          'Válido por 7 dias',
          'Sem assinatura, sem renovação automática',
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#ee2525' }} />
            <span className="text-xs text-foreground">{f}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onComprar}
          disabled={loading}
          className="w-full h-10 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
          style={{ background: '#ee2525' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          Turbinar um evento — R$ 9,99
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Você escolhe qual evento destacar após o pagamento
        </p>
      </div>
    </div>
  );
}

// ─── Plano Pro ────────────────────────────────────────────────────────────────

function ProCard({
  status,
  onAssinar,
  onPortal,
  loading,
  loadingPortal,
}: {
  status: BillingStatus | null;
  onAssinar: () => void;
  onPortal: () => void;
  loading: boolean;
  loadingPortal: boolean;
}) {
  const isPro = status?.plan === 'pro';
  const creditos = status?.boostCredits ?? 0;
  const boostsAtivos = status?.boostsAtivos?.length ?? 0;

  return (
    <div
      className="rounded-2xl border-2 overflow-hidden relative"
      style={{ borderColor: '#8b5cf6', boxShadow: '0 0 0 1px #8b5cf622' }}
    >
      <div className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
        style={{ background: isPro ? '#10b981' : '#8b5cf6' }}>
        {isPro ? '✓ Ativo' : 'Mais popular'}
      </div>

      <div className="px-4 pt-4 pb-3" style={{ background: '#8b5cf612' }}>
        <div className="flex items-center gap-2 mb-1" style={{ color: '#8b5cf6' }}>
          <Zap className="w-5 h-5" />
          <span className="text-sm font-bold">FervoMap Pro</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Assine e turbine até 5 eventos simultâneos todo mês — créditos se renovam automaticamente.
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">R$ 29,99</span>
          <span className="text-xs text-muted-foreground">/mês · </span><span className="text-xs font-semibold text-green-600">7 dias grátis</span><span className="text-xs text-muted-foreground"> · cancele quando quiser</span>
        </div>
      </div>

      {/* Painel de status — só para assinantes */}
      {isPro && (
        <div className="mx-4 mt-3 rounded-xl border border-border p-3 flex flex-col gap-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Seus créditos este mês</p>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-2 rounded-full transition-all"
                style={{ background: i < creditos ? '#8b5cf6' : 'var(--muted)' }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              <span className="font-bold text-foreground">{creditos}</span> crédito{creditos !== 1 ? 's' : ''} disponíve{creditos !== 1 ? 'is' : 'l'}
            </span>
            <span className="text-muted-foreground">
              {boostsAtivos} em destaque agora
            </span>
          </div>
          {status?.planExpiresAt && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5" />
              Renova em {new Date(status.planExpiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </p>
          )}
        </div>
      )}

      <div className="px-4 py-3 flex flex-col gap-1.5">
        {[
          { texto: 'Até 5 eventos em destaque simultâneos', disponivel: true },
          { texto: '5 créditos novos a cada renovação mensal', disponivel: true },
          { texto: 'Marcador destacado e animado no mapa', disponivel: true },
          { texto: 'Aparece no topo da lista "Para você"', disponivel: true },
          { texto: 'Badge "Em destaque" nos eventos', disponivel: true },
          { texto: 'Cancele quando quiser, sem fidelidade', disponivel: true },
          { texto: 'Relatórios de visualização', disponivel: false },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            {f.disponivel
              ? <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#8b5cf6' }} />
              : <Lock className="w-3 h-3 flex-shrink-0 text-muted-foreground/30" />
            }
            <span className="text-xs" style={{ opacity: f.disponivel ? 1 : 0.4 }}>{f.texto}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2">
        {isPro ? (
          <button
            onClick={onPortal}
            disabled={loadingPortal}
            className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-border hover:bg-accent transition-colors disabled:opacity-50"
          >
            {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            Gerenciar assinatura
          </button>
        ) : (
          <button
            onClick={onAssinar}
            disabled={loading}
            className="w-full h-10 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Assinar Pro — R$ 29,99/mês
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Painel principal ─────────────────────────────────────────────────────────

export function PlanosPanel() {
  const isLoggedIn = authService.isAuthenticated();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingPro, setLoadingPro] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isLoggedIn) { setLoadingStatus(false); return; }
    billingService.getStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, [isLoggedIn]);

  async function handleAssinarPro() {
    if (!isLoggedIn) { window.location.href = '/login'; return; }
    setErro(''); setLoadingPro(true);
    try { await billingService.startProSubscription(); }
    catch { setErro('Não foi possível iniciar o checkout. Tente novamente.'); setLoadingPro(false); }
  }

  async function handleBoostAvulso() {
    if (!isLoggedIn) { window.location.href = '/login'; return; }
    // Ao clicar no avulso sem evento selecionado, orienta o usuário
    setErro('Para turbinar um evento avulso, abra o evento no mapa e clique em "Turbinar" dentro dele.');
  }

  async function handlePortal() {
    setErro(''); setLoadingPortal(true);
    try { await billingService.openPortal(); }
    catch { setErro('Não foi possível abrir o portal.'); setLoadingPortal(false); }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <span className="text-4xl">🚀</span>
        <p className="text-sm font-medium text-foreground">Faça login para ver os planos</p>
        <a href="/login" className="text-xs text-white font-semibold px-5 py-2.5 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #ee2525, #fdbb2d)' }}>
          Entrar
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Hero */}
      <div className="rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(135deg, #ee252515, #8b5cf615)' }}>
        <p className="text-base font-bold text-foreground">Destaque seus eventos</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Seus eventos aparecem em destaque no mapa e no topo das listas — mais visibilidade, mais pessoas.
        </p>
      </div>

      {/* Comparação rápida */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border border-border p-3">
          <p className="text-lg font-bold" style={{ color: '#ee2525' }}>R$ 9,99</p>
          <p className="text-[10px] text-muted-foreground">1 evento · pagamento único</p>
        </div>
        <div className="rounded-xl border-2 p-3" style={{ borderColor: '#8b5cf6' }}>
          <p className="text-lg font-bold" style={{ color: '#8b5cf6' }}>R$ 29,99<span className="text-xs font-normal">/mês</span></p>
          <p className="text-[10px] text-muted-foreground">até 5 eventos simultâneos</p>
        </div>
      </div>

      {erro && (
        <p className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl px-3 py-2.5">
          {erro}
        </p>
      )}

      {/* Plano Pro */}
      <ProCard
        status={loadingStatus ? null : status}
        onAssinar={handleAssinarPro}
        onPortal={handlePortal}
        loading={loadingPro}
        loadingPortal={loadingPortal}
      />

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Boost Avulso */}
      <BoostAvulsoCard onComprar={handleBoostAvulso} loading={loadingPro} />

      {/* Rodapé */}
      <div className="flex flex-col gap-1 text-center">
        <p className="text-[10px] text-muted-foreground">
          Pagamento seguro via Stripe · Cartão de crédito/débito
        </p>
        <p className="text-[10px] text-muted-foreground">
          Plano Pro cancela quando quiser, sem multa
        </p>
      </div>
    </div>
  );
}
