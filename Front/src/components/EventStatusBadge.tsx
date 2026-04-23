import { useEffect, useState } from "react";
import { calcEventStatus, STATUS_STYLE, type EventStatus } from "../utils/eventStatus";

interface Props {
  startDate: string;
  endDate?: string | null;
  /** "lg" = banner full-width no topo do painel de detalhes
   *  "sm" = chip compacto para uso em cards de lista */
  size?: 'lg' | 'sm';
  className?: string;
}

/**
 * Badge de status em tempo real.
 * Recalcula a cada 30 segundos para manter "Começa em X min" atualizado.
 */
export function EventStatusBadge({ startDate, endDate, size = 'sm', className = '' }: Props) {
  const [status, setStatus] = useState<EventStatus>(() =>
    calcEventStatus(startDate, endDate),
  );

  useEffect(() => {
    // Recalcula imediatamente se as props mudaram
    setStatus(calcEventStatus(startDate, endDate));

    const interval = setInterval(() => {
      setStatus(calcEventStatus(startDate, endDate));
    }, 30_000);

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const style = STATUS_STYLE[status.type];

  // Não renderiza nada para eventos futuros distantes (apenas mostra data normal)
  if (status.type === 'futuro' && size === 'sm') {
    return null;
  }

  // ── Tamanho GRANDE — banner no topo do EventDetailPanel ─────────────────
  if (size === 'lg') {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 ${className}`}
        style={{ background: style.bg, borderBottom: `1px solid ${style.border}20` }}
      >
        {/* Indicador / dot */}
        <span className="relative flex-shrink-0">
          {style.pulse ? (
            <>
              <span
                className="absolute inline-flex h-3 w-3 rounded-full opacity-75 animate-ping"
                style={{ background: style.dot }}
              />
              <span
                className="relative inline-flex h-3 w-3 rounded-full"
                style={{ background: style.dot }}
              />
            </>
          ) : (
            <span
              className="inline-flex h-3 w-3 rounded-full"
              style={{ background: style.dot }}
            />
          )}
        </span>

        {/* Textos */}
        <div className="flex flex-col leading-tight min-w-0">
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: style.text }}
          >
            {status.label}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {status.sublabel}
          </span>
        </div>

        {/* Pill de tipo — só para ao_vivo e encerrando */}
        {(status.type === 'ao_vivo' || status.type === 'encerrando') && (
          <span
            className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ background: style.border }}
          >
            {status.type === 'ao_vivo' ? 'AO VIVO' : 'ENCERRANDO'}
          </span>
        )}
        {status.type === 'em_breve' && (
          <span
            className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ background: style.border }}
          >
            EM BREVE
          </span>
        )}
        {status.type === 'encerrado' && (
          <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
            ENCERRADO
          </span>
        )}
      </div>
    );
  }

  // ── Tamanho PEQUENO — chip em cards de lista ─────────────────────────────
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${className}`}
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}40` }}
    >
      {style.pulse && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
          style={{ background: style.dot }}
        />
      )}
      {status.type === 'ao_vivo'    && 'Rolando agora'}
      {status.type === 'encerrando' && 'Encerrando'}
      {status.type === 'em_breve'   && status.label}
      {status.type === 'encerrado'  && 'Encerrado'}
    </span>
  );
}
