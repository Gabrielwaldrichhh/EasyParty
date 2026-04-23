export type EventStatus =
  | { type: 'ao_vivo';     label: string; sublabel: string }
  | { type: 'encerrando';  label: string; sublabel: string }
  | { type: 'em_breve';    label: string; sublabel: string }
  | { type: 'futuro';      label: string; sublabel: string }
  | { type: 'encerrado';   label: string; sublabel: string };

/**
 * Calcula o status dinâmico de um evento com base no horário atual.
 * Nenhum input manual — tudo derivado de `startDate` e `endDate`.
 *
 * Thresholds:
 *   "Começa em breve"  — faltando ≤ 60 min para início
 *   "Rolando agora"    — após início, ainda não no período de encerramento
 *   "Encerrando"       — últimos 30 min antes do fim (ou últimos 30 min de uma
 *                        janela estimada de 3h quando endDate não existe)
 *   "Encerrado"        — após o fim
 */
export function calcEventStatus(
  startDateIso: string,
  endDateIso: string | null | undefined,
  now: Date = new Date(),
): EventStatus {
  const start = new Date(startDateIso);

  // Fim real ou estimado (3h após início)
  const end = endDateIso
    ? new Date(endDateIso)
    : new Date(start.getTime() + 3 * 60 * 60 * 1000);

  const diffToStart = start.getTime() - now.getTime(); // ms até início
  const diffToEnd   = end.getTime()   - now.getTime(); // ms até fim

  // ─── Encerrado ────────────────────────────────────────────────────────────
  if (now >= end) {
    return { type: 'encerrado', label: 'Encerrado', sublabel: 'Este evento já terminou' };
  }

  // ─── Em andamento ─────────────────────────────────────────────────────────
  if (now >= start) {
    const minutosRestantes = Math.ceil(diffToEnd / 60_000);

    if (minutosRestantes <= 30) {
      // Últimos 30 min
      if (minutosRestantes <= 1) {
        return { type: 'encerrando', label: 'Encerrando', sublabel: 'Últimos instantes!' };
      }
      return {
        type: 'encerrando',
        label: 'Encerrando',
        sublabel: `Termina em ${minutosRestantes} min`,
      };
    }

    // Rolando normalmente — mostra quanto tempo resta
    const horasRestantes = Math.floor(diffToEnd / (60 * 60_000));
    const minRestantes   = Math.ceil((diffToEnd % (60 * 60_000)) / 60_000);

    let tempoRestante: string;
    if (horasRestantes >= 1) {
      tempoRestante = `Ainda ${horasRestantes}h${minRestantes > 0 ? ` ${minRestantes}min` : ''}`;
    } else {
      tempoRestante = `Ainda ${minRestantes} min`;
    }

    return { type: 'ao_vivo', label: 'Rolando agora 🔥', sublabel: tempoRestante };
  }

  // ─── Antes do início ──────────────────────────────────────────────────────
  const minutosParaInicio = Math.ceil(diffToStart / 60_000);

  if (minutosParaInicio <= 60) {
    if (minutosParaInicio <= 1) {
      return { type: 'em_breve', label: 'Começa agora!', sublabel: 'Menos de 1 minuto' };
    }
    return {
      type: 'em_breve',
      label: `Começa em ${minutosParaInicio} min`,
      sublabel: 'Vai começar em breve',
    };
  }

  const horasParaInicio = Math.floor(diffToStart / (60 * 60_000));
  if (horasParaInicio < 24) {
    const minExtra = Math.ceil((diffToStart % (60 * 60_000)) / 60_000);
    return {
      type: 'futuro',
      label: `Em ${horasParaInicio}h${minExtra > 0 ? ` ${minExtra}min` : ''}`,
      sublabel: start.toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
    };
  }

  const diasParaInicio = Math.ceil(diffToStart / (24 * 60 * 60_000));
  return {
    type: 'futuro',
    label: diasParaInicio === 1 ? 'Amanhã' : `Em ${diasParaInicio} dias`,
    sublabel: start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  };
}

/** Paleta visual para cada tipo de status */
export const STATUS_STYLE: Record<EventStatus['type'], {
  bg: string;
  border: string;
  text: string;
  dot: string;
  pulse: boolean;
}> = {
  ao_vivo:    { bg: '#10b98115', border: '#10b981',  text: '#10b981',  dot: '#10b981',  pulse: true  },
  encerrando: { bg: '#f9731615', border: '#f97316',  text: '#f97316',  dot: '#f97316',  pulse: true  },
  em_breve:   { bg: '#3b82f615', border: '#3b82f6',  text: '#3b82f6',  dot: '#3b82f6',  pulse: true  },
  futuro:     { bg: 'transparent', border: 'var(--border)', text: 'var(--muted-foreground)', dot: 'var(--muted-foreground)', pulse: false },
  encerrado:  { bg: 'transparent', border: 'var(--border)', text: 'var(--muted-foreground)', dot: '#6b7280', pulse: false },
};
