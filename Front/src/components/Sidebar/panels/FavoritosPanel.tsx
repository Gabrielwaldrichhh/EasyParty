import { Star, MapPin, Clock } from "lucide-react";
import { CATEGORY_CONFIG } from "../../../config/categories";
import type { Event, User } from "../../../types";

interface Props {
  currentUser: User | null;
  events: Event[];
  favorites: Set<string>;
  onToggleFavorite: (eventId: string) => void;
  onEventClick: (event: Event) => void;
}

export function FavoritosPanel({ currentUser, events, favorites, onToggleFavorite, onEventClick }: Props) {
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <span className="text-4xl">⭐</span>
        <p className="text-sm font-medium text-foreground">Entre para salvar favoritos</p>
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

  const favEvents = events.filter(e => favorites.has(e.id));

  return (
    <div className="flex flex-col gap-3 pb-4">
      {favEvents.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">{favEvents.length} evento{favEvents.length > 1 ? 's' : ''} salvos</p>
          {favEvents.map(event => {
            const cfg = CATEGORY_CONFIG[event.category];
            const dataInicio = new Date(event.date);
            const dataFim = event.endDate ? new Date(event.endDate) : null;
            return (
              <div key={event.id} className="rounded-xl border border-border overflow-hidden">
                <div className="h-0.5 w-full" style={{ background: cfg.color }} />
                <div className="p-3 flex gap-3">
                  <button
                    className="flex-1 text-left flex flex-col gap-1"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cfg.emoji}</span>
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{event.title}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {dataFim && ` – ${dataFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    {(event.address || event.venue?.name) && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        {event.venue?.name ?? event.address}
                      </p>
                    )}
                  </button>
                  <button
                    onClick={() => onToggleFavorite(event.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-accent transition-colors"
                    title="Remover dos favoritos"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <span className="text-4xl">⭐</span>
          <p className="text-sm font-medium text-foreground">Nenhum favorito ainda</p>
          <p className="text-xs text-muted-foreground">Clique na estrela em um evento para salvar aqui.</p>
        </div>
      )}
    </div>
  );
}
