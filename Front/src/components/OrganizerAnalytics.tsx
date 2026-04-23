import { useEffect, useRef, useState } from "react";
import { Eye, Users, TrendingUp, ArrowUp, ArrowDown, Minus, Zap } from "lucide-react";
import { socialProofService, type SocialProof } from "../services/socialProofService";

interface Props {
  eventId: string;
  isBoosted: boolean;
}


/**
 * Painel de analytics para o organizador.
 * Responde uma pergunta: "Isso está trazendo gente pro meu evento?"
 *
 * Faz polling a cada 30s e guarda o snapshot anterior para calcular variação.
 */
export function OrganizerAnalytics({ eventId, isBoosted }: Props) {
  const [current, setCurrent]   = useState<SocialProof | null>(null);
  const [previous, setPrevious] = useState<SocialProof | null>(null);
  const prevRef = useRef<SocialProof | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const data = await socialProofService.getProof(eventId);
        if (cancelled) return;
        setPrevious(prevRef.current);
        prevRef.current = data;
        setCurrent(data);
      } catch { /* silencia */ }
    }

    fetch();
    timerRef.current = setInterval(fetch, 30_000);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [eventId]);

  if (!current) {
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
          <div className="h-3 w-32 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl bg-muted/40 h-20 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Calcula variações ────────────────────────────────────────────────────
  function delta(curr: number, prev: number | undefined) {
    if (prev == null) return null;
    return curr - prev;
  }

  const dViews   = delta(current.visualizacoes, previous?.visualizacoes);
  const dPessoas = delta(current.pessoasAgora,  previous?.pessoasAgora);

  // Pessoas "geradas" pelo EasyParty — o número mais importante.
  // Estimativa: pessoas agora + crescimento recente + fator de conversão (30%)
  const chegadas = current.textoChegaram
    ? parseInt(current.textoChegaram.match(/\+(\d+)/)?.[1] ?? '0')
    : 0;
  const pessoasGeradas = Math.max(
    current.pessoasAgora,
    Math.round(current.pessoasAgora + chegadas * 0.3),
  );

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #ee252508, #8b5cf608)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-bold text-foreground uppercase tracking-wide">
            Seu evento ao vivo
          </p>
        </div>
        {isBoosted && (
          <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: '#8b5cf6' }}>
            <Zap className="w-2.5 h-2.5" />
            Turbinado
          </span>
        )}
      </div>

      {/* Destaque principal — "Pessoas geradas pelo EasyParty" */}
      <div className="px-5 py-5 border-b border-border/60"
        style={{ background: 'linear-gradient(135deg, #10b98108, #3b82f608)' }}>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Pessoas levadas pelo EasyParty
        </p>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-black text-foreground leading-none">
            {pessoasGeradas < 10 ? pessoasGeradas : `+${Math.floor(pessoasGeradas / 5) * 5}`}
          </span>
          {current.textoChegaram && (
            <span className="text-sm font-semibold text-emerald-500 mb-1 flex items-center gap-1">
              <ArrowUp className="w-3.5 h-3.5" />
              {current.textoChegaram.replace('chegaram na última hora', 'na última hora')}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {current.isLive
            ? 'rolando agora · com base nos acessos em tempo real'
            : current.isUpcoming
            ? 'estimado com base no interesse registrado'
            : 'estimado com base nos acessos ao evento'}
        </p>
      </div>

      {/* Grid de métricas — 2×2 com cards maiores */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Eye className="w-4 h-4" />}
          label="Visualizações"
          value={current.visualizacoes}
          delta={dViews}
          color="#3b82f6"
          format={n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)}
        />
        <MetricCard
          icon={<Users className="w-4 h-4" />}
          label="Pessoas agora"
          value={current.pessoasAgora}
          delta={dPessoas}
          color="#10b981"
          format={n => n >= 50 ? `+${Math.floor(n / 10) * 10}` : String(n)}
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Check-ins"
          value={current.totalCheckins ?? 0}
          delta={null}
          color="#f97316"
          format={n => n > 0 ? String(n) : '—'}
          subtitle="presença confirmada"
        />
        <MetricCard
          icon={<Zap className="w-4 h-4" />}
          label="Interesse"
          value={Math.round((current.visualizacoes / Math.max(1, current.visualizacoes + 50)) * 100)}
          delta={null}
          color="#8b5cf6"
          format={n => `${Math.min(n, 99)}%`}
          subtitle="taxa de engaj."
        />
      </div>

      {/* CTA se não está turbinado */}
      {!isBoosted && (
        <div className="px-3 pb-3">
          <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            style={{ background: '#ee252510', border: '1px solid #ee252525' }}>
            <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#ee2525' }} />
            <p className="text-[11px] text-muted-foreground leading-snug">
              <span className="font-semibold text-foreground">Turbine</span> para aparecer em destaque no mapa e multiplicar esses números.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente de métrica individual ────────────────────────────────────────

function MetricCard({
  icon, label, value, delta, color, format, subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  delta: number | null;
  color: string;
  format: (n: number) => string;
  subtitle?: string;
}) {
  const hasDelta = delta != null && delta !== 0;
  const isUp = (delta ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-border/60 p-4 flex flex-col gap-2"
      style={{ background: color + '08' }}>
      <div className="flex items-center justify-between">
        <span style={{ color }} className="opacity-80">{icon}</span>
        {hasDelta && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isUp ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400'
          }`}>
            {isUp ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
            {Math.abs(delta!)}
          </span>
        )}
        {!hasDelta && delta === 0 && (
          <Minus className="w-3 h-3 text-muted-foreground/30" />
        )}
      </div>
      <p className="text-2xl font-black text-foreground leading-none">{format(value)}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {subtitle ?? label}
      </p>
    </div>
  );
}
