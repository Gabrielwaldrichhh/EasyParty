import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Users, Zap, TrendingUp, Calendar, ArrowLeft,
  ArrowUp, ArrowDown, RefreshCw, MapPin, DollarSign,
  Rocket, BarChart2, Star, Clock, ChevronRight, Shield,
} from 'lucide-react';
import { useDashboard, type EventMetrica } from '../hooks/useDashboard';
import { billingService } from '../services/billingService';
import { CATEGORY_CONFIG } from '../config/categories';
import type { Category } from '../types';
import logo from '../img/logoo-new-png.png';

// ── Paleta de cores ────────────────────────────────────────────────────────────

const BRAND = 'linear-gradient(135deg, #ee2525 0%, #f5711a 55%, #fdbb2d 100%)';
const C = {
  views:    '#3b82f6',
  checkins: '#10b981',
  hype:     '#f59e0b',
  boost:    '#8b5cf6',
  roi:      '#ee2525',
  people:   '#06b6d4',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number, opts?: { k?: boolean; R$?: boolean; pct?: boolean }) {
  if (opts?.R$) return `R$ ${n.toFixed(2)}`;
  if (opts?.pct) return `${n > 0 ? '+' : ''}${n}%`;
  if (opts?.k && n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function hypeLabel(score: number) {
  if (score >= 70) return { text: '🔥 Bombando', color: '#ee2525' };
  if (score >= 45) return { text: '📈 Em alta',  color: '#f59e0b' };
  if (score >= 20) return { text: '✨ Aquecendo', color: '#10b981' };
  return { text: '💤 Frio', color: '#6b7280' };
}

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Expirado';
  const dias = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  if (dias > 0) return `${dias}d ${horas}h restantes`;
  return `${horas}h restantes`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-xl bg-white/5 animate-pulse ${className ?? ''}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, color, trend, trendLabel,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  color: string; trend?: 'up' | 'down' | 'neutral'; trendLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 p-5 flex flex-col gap-3 hover:border-white/15 transition-colors"
      style={{ background: color + '10' }}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: color + '20' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trendLabel && (
          <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-emerald-500/15 text-emerald-400' :
            trend === 'down' ? 'bg-red-500/15 text-red-400' :
            'bg-white/10 text-white/50'
          }`}>
            {trend === 'up' && <ArrowUp className="w-2.5 h-2.5" />}
            {trend === 'down' && <ArrowDown className="w-2.5 h-2.5" />}
            {trendLabel}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
      </div>
      <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}

// ── Gráfico de barras inline ───────────────────────────────────────────────────

function BarChart({
  series, labels, color, title,
}: {
  series: number[]; labels: string[]; color: string; title: string;
}) {
  const max = Math.max(...series, 1);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{title}</p>
      <div className="flex items-end gap-1.5 h-20">
        {series.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-sm transition-all"
              style={{ height: `${Math.max(4, (v / max) * 72)}px`, background: color + 'cc' }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-white/30">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ROI Card ──────────────────────────────────────────────────────────────────

function RoiCard({ roi }: { roi: NonNullable<ReturnType<typeof useDashboard>['data']>['roi'] }) {
  const positivo = roi.roiPercent !== null && roi.roiPercent > 0;
  return (
    <div className="rounded-2xl border border-white/8 p-6 flex flex-col gap-5"
      style={{ background: '#ee252508' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#ee252520' }}>
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-sm font-bold text-white">ROI & Investimento</p>
        </div>
        {roi.roiPercent !== null && (
          <span className={`text-lg font-black px-3 py-1 rounded-xl ${
            positivo ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
          }`}>
            {positivo ? '+' : ''}{roi.roiPercent}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Investido em boosts', value: fmt(roi.gastoBoosts, { R$: true }), color: '#ee2525' },
          { label: 'Assinatura Pro',       value: fmt(roi.gastoAssinatura, { R$: true }), color: '#8b5cf6' },
          { label: 'Receita estimada',     value: fmt(roi.receitaEstimada, { R$: true }), color: '#10b981' },
          { label: 'Pessoas geradas',      value: fmt(roi.pessoasGeradas, { k: true }), color: '#06b6d4' },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-white/6 p-3 flex flex-col gap-1">
            <p className="text-xl font-black" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] text-white/40 leading-tight">{m.label}</p>
          </div>
        ))}
      </div>

      {roi.roiPercent === null && (
        <p className="text-xs text-white/35 text-center">
          Crie eventos com ingressos pagos e use boost para ver o ROI.
        </p>
      )}
    </div>
  );
}

// ── Card de Evento ─────────────────────────────────────────────────────────────

function EventCard({ m, rank }: { m: EventMetrica; rank?: number }) {
  const cfg = CATEGORY_CONFIG[m.category as Category] ?? CATEGORY_CONFIG.OTHER;
  const hype = hypeLabel(m.hypeScore);
  const inicio = new Date(m.date);

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden hover:border-white/15 transition-all">
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: cfg.color + '15' }}>
        {rank !== undefined && (
          <span className="text-xs font-black text-white/30 w-5 flex-shrink-0">#{rank + 1}</span>
        )}
        {m.imageUrl ? (
          <img src={m.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{m.title}</p>
          <p className="text-[10px] text-white/45 flex items-center gap-1 mt-0.5">
            <Calendar className="w-2.5 h-2.5" />
            {inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            {m.venue && <><MapPin className="w-2.5 h-2.5 ml-1" />{m.venue}</>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: hype.color, background: hype.color + '20' }}>
            {hype.text}
          </span>
          {m.isBoosted && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: C.boost }}>
              <Zap className="w-2 h-2 inline mr-0.5" />Boost
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 grid grid-cols-4 gap-2 border-t border-white/5">
        {[
          { icon: Eye,        val: fmt(m.views, { k: true }),    color: C.views    },
          { icon: Users,      val: fmt(m.checkins),               color: C.checkins },
          { icon: TrendingUp, val: `${m.hypeScore}`,              color: C.hype     },
          { icon: Users,      val: fmt(m.pessoasAgora, { k: true }), color: C.people },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <s.icon className="w-3 h-3" style={{ color: s.color }} />
            <span className="text-xs font-bold text-white">{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Boost Status ──────────────────────────────────────────────────────────────

function BoostCard({ boost }: { boost: NonNullable<ReturnType<typeof useDashboard>['data']>['boostsAtivos'][0] }) {
  const cfg = CATEGORY_CONFIG[boost.category as Category] ?? CATEGORY_CONFIG.OTHER;
  const ms = new Date(boost.expiresAt).getTime() - Date.now();
  const pct = Math.max(0, Math.min(100, (ms / (7 * 86400000)) * 100));

  return (
    <div className="rounded-xl border border-white/8 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{boost.title}</p>
          <p className="text-[10px] text-white/40 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {timeLeft(boost.expiresAt)}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: boost.boostType === 'avulso' ? '#ee2525' : '#8b5cf6' }}>
          {boost.boostType === 'avulso' ? 'Avulso' : 'Pro'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct > 40 ? C.boost : '#ee2525' }} />
      </div>
    </div>
  );
}

// ── Plano Banner ──────────────────────────────────────────────────────────────

function PlanoBanner({
  plan, credits, onUpgrade,
}: { plan: 'free' | 'pro'; credits: number; onUpgrade: () => void }) {
  if (plan === 'pro') {
    return (
      <div className="rounded-2xl border border-purple-500/30 p-4 flex items-center gap-4"
        style={{ background: '#8b5cf610' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#8b5cf620' }}>
          <Shield className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">FervoMap Pro ativo</p>
          <p className="text-xs text-white/50">
            {credits} crédito{credits !== 1 ? 's' : ''} disponíve{credits !== 1 ? 'is' : 'l'} este mês
          </p>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-4 h-4 rounded-full flex-shrink-0 transition-all"
              style={{ background: i < credits ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <button onClick={onUpgrade}
      className="rounded-2xl border border-white/10 p-4 flex items-center gap-4 w-full text-left hover:border-white/20 transition-all group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: BRAND, boxShadow: '0 0 20px #ee252530' }}>
        <Rocket className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">Upgrade para Pro</p>
        <p className="text-xs text-white/45">5 boosts/mês + analytics avançado por R$ 29,99/mês</p>
      </div>
      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
    </button>
  );
}

// ── Tabela de todos os eventos ────────────────────────────────────────────────

function TabelaEventos({ metricas }: { metricas: EventMetrica[] }) {
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'encerrados'>('todos');
  const [ordem, setOrdem] = useState<'views' | 'checkins' | 'hype' | 'data'>('hype');

  const filtrados = metricas
    .filter(m => filtro === 'todos' ? true : filtro === 'ativos' ? m.isAtivo : !m.isAtivo)
    .sort((a, b) => {
      if (ordem === 'views') return b.views - a.views;
      if (ordem === 'checkins') return b.checkins - a.checkins;
      if (ordem === 'hype') return b.hypeScore - a.hypeScore;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-bold text-white">Todos os eventos</p>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro status */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            {(['todos', 'ativos', 'encerrados'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all ${
                  filtro === f ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {/* Ordenação */}
          <select value={ordem} onChange={e => setOrdem(e.target.value as typeof ordem)}
            className="h-9 px-3 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white/70 focus:outline-none focus:border-white/25">
            <option value="hype">Ordenar: Hype</option>
            <option value="views">Ordenar: Views</option>
            <option value="checkins">Ordenar: Check-ins</option>
            <option value="data">Ordenar: Data</option>
          </select>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-white/8 p-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-sm text-white/50">Nenhum evento nesta categoria ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map(m => <EventCard key={m.eventId} m={m} />)}
        </div>
      )}
    </div>
  );
}

// ── Navbar do Dashboard ───────────────────────────────────────────────────────

function DashNav({ onBack, onRefresh, lastUpdate, loading }: {
  onBack: () => void; onRefresh: () => void; lastUpdate: Date | null; loading: boolean;
}) {
  return (
    <nav className="sticky top-0 z-10 border-b border-white/8 bg-black/60 backdrop-blur-xl px-6 h-14 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: BRAND }}>
            <img src={logo} alt="" className="w-4 h-4 object-contain" />
          </div>
          <span className="text-sm font-bold text-white">Dashboard</span>
          <span className="text-xs text-white/30 font-medium hidden sm:block">· Organizador</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdate && (
          <p className="text-[10px] text-white/30 hidden sm:block">
            Atualizado {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        <button onClick={onRefresh} disabled={loading}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Ao vivo
        </div>
      </div>
    </nav>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch, lastUpdate } = useDashboard();
  async function handleUpgrade() {
    try { await billingService.startProSubscription(); }
    catch { /* silencia — redirecionamento Stripe */ }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080808' }}>
      <DashNav
        onBack={() => navigate(-1)}
        onRefresh={refetch}
        lastUpdate={lastUpdate}
        loading={loading}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">

        {/* Estado de erro */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && <DashboardSkeleton />}

        {data && (
          <>
            {/* ── Plano ───────────────────────────────────────────────────── */}
            <PlanoBanner
              plan={data.overview.plan}
              credits={data.overview.boostCredits}
              onUpgrade={handleUpgrade}
            />

            {/* ── KPIs principais ──────────────────────────────────────────── */}
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Visão geral</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard icon={Calendar}   label="Eventos"       value={String(data.overview.totalEventos)}  color={C.views}    sub={`${data.overview.eventosAtivos} ativos`} />
                <KpiCard icon={Zap}        label="Ao vivo"       value={String(data.overview.emAndamento)}   color={C.hype}     sub="em andamento agora" />
                <KpiCard icon={Eye}        label="Views totais"  value={fmt(data.overview.totalViews, { k: true })} color={C.views}    />
                <KpiCard icon={Users}      label="Check-ins"     value={fmt(data.overview.totalCheckins, { k: true })} color={C.checkins} />
                <KpiCard icon={Rocket}     label="Boosts ativos" value={String(data.overview.boostsAtivos)}  color={C.boost}    sub="eventos em destaque" />
                <KpiCard icon={BarChart2}  label="Futuros"       value={String(data.overview.futuros)}       color={C.people}   sub="próximos eventos" />
              </div>
            </div>

            {/* ── Gráficos + ROI ─────────────────────────────────────────── */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Gráfico views */}
              <div className="rounded-2xl border border-white/8 p-5" style={{ background: C.views + '08' }}>
                <BarChart
                  series={data.historico.serieViews}
                  labels={data.historico.labels}
                  color={C.views}
                  title="Views — últimos 7 dias"
                />
              </div>

              {/* Gráfico check-ins */}
              <div className="rounded-2xl border border-white/8 p-5" style={{ background: C.checkins + '08' }}>
                <BarChart
                  series={data.historico.serieCheckins}
                  labels={data.historico.labels}
                  color={C.checkins}
                  title="Check-ins — últimos 7 dias"
                />
              </div>

              {/* ROI */}
              <RoiCard roi={data.roi} />
            </div>

            {/* ── Top eventos (hype) ─────────────────────────────────────── */}
            {data.topEventos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <p className="text-sm font-bold text-white">Top eventos por hype</p>
                  <span className="text-xs text-white/30">tempo real</span>
                </div>
                <div className="flex flex-col gap-2">
                  {data.topEventos.map((m, i) => (
                    <EventCard key={m.eventId} m={m} rank={i} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Boosts ativos ──────────────────────────────────────────── */}
            {data.boostsAtivos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4" style={{ color: C.boost }} />
                  <p className="text-sm font-bold text-white">Boosts ativos</p>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: C.boost }}>
                    {data.boostsAtivos.length}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.boostsAtivos.map(b => (
                    <BoostCard key={b.eventId + b.paidAt} boost={b} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Sem boosts ativos ─────────────────────────────────────── */}
            {data.boostsAtivos.length === 0 && data.overview.eventosAtivos > 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#ee252520' }}>
                  <Rocket className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-bold text-white mb-1">Nenhum evento em destaque</p>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Eventos com boost aparecem em destaque no mapa e no topo das listas — mais visibilidade, mais pessoas.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app')}
                  className="h-10 px-5 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all hover:opacity-90"
                  style={{ background: BRAND }}>
                  Turbinar evento
                </button>
              </div>
            )}

            {/* ── Tabela completa ────────────────────────────────────────── */}
            {data.metricas.length > 0 ? (
              <TabelaEventos metricas={data.metricas} />
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center flex flex-col items-center gap-4">
                <span className="text-5xl">🎉</span>
                <div>
                  <p className="text-sm font-bold text-white mb-1">Nenhum evento criado ainda</p>
                  <p className="text-xs text-white/40">Crie seu primeiro evento no mapa e acompanhe as métricas aqui.</p>
                </div>
                <button
                  onClick={() => navigate('/app')}
                  className="h-10 px-6 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: BRAND }}>
                  Abrir mapa
                </button>
              </div>
            )}

            {/* ── Rodapé informativo ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-white/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white/40 font-medium">Dados em tempo real</span>
              </div>
              <p className="text-xs text-white/25 leading-relaxed">
                Views e check-ins são contabilizados em memória e reiniciam ao reiniciar o servidor.
                Histórico persistente estará disponível em versões futuras.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
