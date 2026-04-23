import { Plus, Calendar, Users, Clock, Pencil } from "lucide-react";
import { CATEGORY_CONFIG } from "../../../config/categories";
import { EventStatusBadge } from "../../EventStatusBadge";
import type { Event, User } from "../../../types";

interface Props {
  events: Event[];
  currentUser: User | null;
  onEventClick: (event: Event) => void;
  onCreateClick: () => void;
}

function MeuEventoCard({
  event,
  onClick,
}: {
  event: Event;
  onClick: () => void;
}) {
  const cfg = CATEGORY_CONFIG[event.category];
  const dataInicio = new Date(event.date);
  const dataFim = event.endDate ? new Date(event.endDate) : null;
  const agora = new Date();
  const passou = dataFim ? dataFim < agora : dataInicio < agora;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border overflow-hidden group transition-all hover:border-border/80"
      style={{ opacity: passou ? 0.55 : 1 }}
    >
      <div
        className="px-3 py-2.5 flex items-start gap-3"
        style={{ background: cfg.color + '15' }}
      >
        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-2.5 h-2.5" />
            {dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            {' · '}
            <Clock className="w-2.5 h-2.5" />
            {dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {dataFim && ` – ${dataFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Badge de status dinâmico */}
          <EventStatusBadge startDate={event.date} endDate={event.endDate} size="sm" />
          {/* Fallback estático para eventos futuros distantes */}
          {!passou && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white" style={{ background: cfg.color }}>
              Ativo
            </span>
          )}
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Pencil className="w-2.5 h-2.5" />
            editar
          </div>
        </div>
      </div>
      <div className="px-3 py-1.5 flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/50">
        {event.maxCapacity ? (
          <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> Cap. {event.maxCapacity}</span>
        ) : (
          <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> Sem limite</span>
        )}
        <span>{event.isPublic ? '🌐 Público' : '🔒 Privado'}</span>
        {event.price === 0 ? (
          <span className="text-emerald-600 font-medium">Gratuito</span>
        ) : (
          <span>R$ {event.price.toFixed(2)}</span>
        )}
      </div>
    </button>
  );
}

export function SuasFestasPanel({ events, currentUser, onEventClick, onCreateClick }: Props) {
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <span className="text-4xl">🔒</span>
        <p className="text-sm font-medium text-foreground">Entre para ver seus eventos</p>
        <a
          href="/login"
          className="text-xs text-white font-semibold px-4 py-2 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #ee2525, #fdbb2d)' }}
        >
          Fazer login
        </a>
      </div>
    );
  }

  const meusEventos = events.filter(e => e.author.id === currentUser.id);
  const ativos = meusEventos.filter(e => {
    const fim = e.endDate ? new Date(e.endDate) : new Date(new Date(e.date).getTime() + 24 * 60 * 60 * 1000);
    return fim >= new Date();
  });
  const encerrados = meusEventos.filter(e => {
    const fim = e.endDate ? new Date(e.endDate) : new Date(new Date(e.date).getTime() + 24 * 60 * 60 * 1000);
    return fim < new Date();
  });

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Criados', value: meusEventos.length, color: '#ee2525' },
          { label: 'Ativos', value: ativos.length, color: '#10b981' },
          { label: 'Encerrados', value: encerrados.length, color: '#6b7280' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border p-2.5 text-center">
            <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Botão criar */}
      <button
        onClick={onCreateClick}
        className="w-full h-10 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #ee2525, #fdbb2d)' }}
      >
        <Plus className="w-4 h-4" />
        Criar novo evento
      </button>

      {/* Ativos */}
      {ativos.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ativos ({ativos.length})
          </p>
          <div className="flex flex-col gap-2">
            {ativos.map(e => (
              <MeuEventoCard key={e.id} event={e} onClick={() => onEventClick(e)} />
            ))}
          </div>
        </section>
      )}

      {/* Encerrados */}
      {encerrados.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Histórico ({encerrados.length})
          </p>
          <div className="flex flex-col gap-2">
            {encerrados.slice(0, 5).map(e => (
              <MeuEventoCard key={e.id} event={e} onClick={() => onEventClick(e)} />
            ))}
          </div>
        </section>
      )}

      {meusEventos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <span className="text-4xl">🎉</span>
          <p className="text-sm font-medium text-foreground">Você ainda não criou eventos</p>
          <p className="text-xs text-muted-foreground">Clique no mapa para escolher um local e criar seu primeiro evento!</p>
        </div>
      )}
    </div>
  );
}
