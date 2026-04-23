import { MapPin, Clock, Tag, Flame } from "lucide-react";
import { CATEGORY_CONFIG } from "../../../config/categories";
import { EventStatusBadge } from "../../EventStatusBadge";
import { HypeBadge } from "../../HypeBadge";
import { useHype } from "../../../hooks/useHype";
import { sortByHype } from "../../../utils/hype";
import type { Event } from "../../../types";

interface Props {
  events: Event[];
  onEventClick: (event: Event) => void;
}

function EventCard({
  event,
  proof,
  onClick,
}: {
  event: Event;
  proof?: Parameters<typeof HypeBadge>[0]['proof'];
  onClick: () => void;
}) {
  const cfg = CATEGORY_CONFIG[event.category];
  const dataInicio = new Date(event.date);
  const dataFim = event.endDate ? new Date(event.endDate) : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-background/60 hover:bg-accent transition-all overflow-hidden group"
    >
      <div className="h-1 w-full" style={{ background: cfg.color }} />
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-foreground/90">
            {event.title}
          </span>
          <span className="text-base flex-shrink-0 leading-none mt-0.5">{cfg.emoji}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: cfg.color + '22', color: cfg.color }}
          >
            {cfg.label}
          </span>
          {/* Hype badge — só aparece quando relevante */}
          <HypeBadge event={event} proof={proof} size="sm" />
          {/* Status tempo real */}
          <EventStatusBadge startDate={event.date} endDate={event.endDate} size="sm" />
          {event.price === 0 ? (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
              Gratuito
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              R$ {event.price.toFixed(2)}
            </span>
          )}
          {event.minAge && event.minAge >= 18 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500">
              {event.minAge}+
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {dataFim && ` – ${dataFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>

        {(event.address || event.venue?.name) && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {event.venue?.name ?? event.address}
          </p>
        )}
      </div>
    </button>
  );
}

export function ParaVocePanel({ events, onEventClick }: Props) {
  const agora = new Date();
  const proofs = useHype(events);

  const emAndamento = events.filter(e => {
    const fim = e.endDate ? new Date(e.endDate) : new Date(new Date(e.date).getTime() + 5 * 60 * 60 * 1000);
    return new Date(e.date) <= agora && fim >= agora;
  });

  // Ordena por hype dentro de cada seção
  const emAndamentoSorted = sortByHype(emAndamento, proofs);

  const proximos = sortByHype(
    events.filter(e => new Date(e.date) > agora),
    proofs,
  ).slice(0, 12);

  const gratuitos = sortByHype(
    events.filter(e => e.price === 0),
    proofs,
  ).slice(0, 5);

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Acontecendo agora — ordenado por hype */}
      {emAndamentoSorted.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Acontecendo agora</p>
          </div>
          <div className="flex flex-col gap-2">
            {emAndamentoSorted.map(e => (
              <EventCard key={e.id} event={e} proof={proofs.get(e.id)} onClick={() => onEventClick(e)} />
            ))}
          </div>
        </section>
      )}

      {/* Próximos — ordenados por hype (eventos bombando sobem) */}
      {proximos.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Em alta agora</p>
          </div>
          <div className="flex flex-col gap-2">
            {proximos.map(e => (
              <EventCard key={e.id} event={e} proof={proofs.get(e.id)} onClick={() => onEventClick(e)} />
            ))}
          </div>
        </section>
      )}

      {/* Gratuitos — também ordenados por hype */}
      {gratuitos.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Entrada gratuita</p>
          </div>
          <div className="flex flex-col gap-2">
            {gratuitos.map(e => (
              <EventCard key={e.id} event={e} proof={proofs.get(e.id)} onClick={() => onEventClick(e)} />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <span className="text-4xl">🗺️</span>
          <p className="text-sm font-medium text-foreground">Nenhum evento no mapa ainda</p>
          <p className="text-xs text-muted-foreground">Clique no mapa para adicionar o primeiro!</p>
        </div>
      )}
    </div>
  );
}
