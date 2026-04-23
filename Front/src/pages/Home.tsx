import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { ThemeProvider } from "../components/theme-provider";
import { Sidebar } from "../components/Sidebar/side-bar";
import { MapSearch } from "../components/map/MapSearch";
import { MapControls } from "../components/map/MapControls";
import { MapClickMenu } from "../components/map/MapClickMenu";
import { CreateEventModal } from "../components/map/CreateEventModal";
import { EventDetailPanel } from "../components/map/EventDetailPanel";
import { MapFilters, defaultFilters, hasActiveFilters } from "../components/map/MapFilters";
import type { FilterState } from "../components/map/MapFilters";
import { useEvents } from "../hooks/useEvents";
import { useHype } from "../hooks/useHype";
import { calcHype } from "../utils/hype";
import { useTheme } from "../components/theme-provider";
import { authService } from "../services/authService";
import { CATEGORY_CONFIG } from "../config/categories";
import type { Event, Category, MapClickPosition, CreateEventPayload, UpdateEventPayload } from "../types";

const TILE_LAYERS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

function createMarkerIcon(category: Category, hypeScore = 0) {
  const { color, emoji } = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.PARTY;

  // Tamanho e sombra crescem com o hype
  const isBombando  = hypeScore >= 70;
  const isAlta      = hypeScore >= 45;
  const isAquecendo = hypeScore >= 25;

  const size   = isBombando ? 46 : isAlta ? 42 : isAquecendo ? 39 : 36;
  const shadow = isBombando
    ? `0 0 0 4px ${color}40, 0 4px 16px rgba(0,0,0,0.4)`
    : isAlta
    ? `0 0 0 2px ${color}30, 0 3px 12px rgba(0,0,0,0.35)`
    : '0 3px 10px rgba(0,0,0,0.3)';

  // Anel pulsante para eventos bombando
  const pulseRing = isBombando
    ? `<div style="
        position:absolute;inset:-6px;border-radius:50% 50% 50% 0;
        border:2px solid ${color};opacity:0.5;
        animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
      "></div>`
    : '';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulseRing}
        <div style="
          position:absolute;inset:0;
          display:flex;align-items:center;justify-content:center;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:${color};
          box-shadow:${shadow};
          border:2px solid white;
        ">
          <span style="transform:rotate(45deg);font-size:${isBombando ? 18 : isAlta ? 16 : 15}px;line-height:1;">${emoji}</span>
        </div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 2)],
  });
}

function MapContent() {
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const { events, createEvent, updateEvent, deleteEvent } = useEvents();
  const hypeProofs = useHype(events);
  const { theme } = useTheme();
  const isLoggedIn = authService.isAuthenticated();
  const currentUser = authService.getStoredUser();

  const [clickMenu, setClickMenu] = useState<MapClickPosition | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ event: Event; x: number; y: number } | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters());
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ep_favorites') ?? '[]')); }
    catch { return new Set(); }
  });

  function toggleFavorite(id: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('ep_favorites', JSON.stringify([...next]));
      return next;
    });
  }

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  function irParaMinhaLocalizacao() {
    if (!navigator.geolocation) { setGeoStatus('denied'); return; }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.flyTo([coords.latitude, coords.longitude], 14, { animate: true, duration: 1.4 });
        setGeoStatus('done');
        setTimeout(() => setGeoStatus('idle'), 3000);
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  // Inicializa mapa
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", { zoomControl: false, attributionControl: false })
      .setView([-26.9212, -49.0395], 13);

    const tileUrl = resolvedTheme === 'dark' ? TILE_LAYERS.dark : TILE_LAYERS.light;
    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: '' })
      .addAttribution('© <a href="https://carto.com">CARTO</a>')
      .addTo(map);

    // Clique no mapa → abre menu de criação, fecha painéis
    map.on('click', (e: L.LeafletMouseEvent) => {
      setSelectedEvent(null);
      setDeleteConfirm(null);
      const containerPoint = map.latLngToContainerPoint(e.latlng);
      setClickMenu({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        screenX: containerPoint.x,
        screenY: containerPoint.y,
      });
    });

    mapRef.current = map;

    // Solicita localização automaticamente ao abrir
    irParaMinhaLocalizacao();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Troca tile com o tema
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.remove();
    const tileUrl = resolvedTheme === 'dark' ? TILE_LAYERS.dark : TILE_LAYERS.light;
    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(mapRef.current);
  }, [resolvedTheme]);

  // Renderiza markers dos eventos
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const now = new Date();

    const visibleEvents = events.filter(event => {
      const eventStart = new Date(event.date);
      const eventEnd   = event.endDate
        ? new Date(event.endDate)
        : new Date(eventStart.getTime() + 3 * 60 * 60 * 1000);

      // Categoria
      if (filters.categories.size > 0 && !filters.categories.has(event.category)) return false;

      // Apenas gratuitos
      if (filters.apenasGratuitos && event.price > 0) return false;

      // Preço máximo
      if (filters.precoMax !== null && event.price > filters.precoMax) return false;

      // Chips de tempo rápido (proximasHoras)
      if (filters.proximasHoras !== null) {
        if (filters.proximasHoras === 0) {
          // "Agora" — evento em andamento
          if (!(eventStart <= now && eventEnd >= now)) return false;
        } else {
          // Nas próximas N horas: começa agora até daqui N horas, OU já está em andamento
          const limite = new Date(now.getTime() + filters.proximasHoras * 60 * 60 * 1000);
          const emAndamento = eventStart <= now && eventEnd >= now;
          const começaEm    = eventStart > now && eventStart <= limite;
          if (!emAndamento && !começaEm) return false;
        }
      }

      // Data específica (só aplica se não há filtro de tempo rápido)
      if (!filters.proximasHoras && filters.dataFiltro) {
        const [fy, fm, fd] = filters.dataFiltro.split('-').map(Number);
        if (
          eventStart.getFullYear() !== fy ||
          eventStart.getMonth() + 1 !== fm ||
          eventStart.getDate() !== fd
        ) return false;
      }

      // Faixa de horário manual
      if (!filters.proximasHoras) {
        if (filters.horaInicio) {
          const [hh, mm] = filters.horaInicio.split(':').map(Number);
          const eventMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
          if (eventMinutes < hh * 60 + mm) return false;
        }
        if (filters.horaFim) {
          const [hh, mm] = filters.horaFim.split(':').map(Number);
          const eventMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
          if (eventMinutes > hh * 60 + mm) return false;
        }
      }

      // Com check-ins — filtra pelo hype/proof (se disponível)
      // Simplificado: eventos com ao menos 1 pessoa agora (que vem dos check-ins)
      if (filters.apenasComCheckin) {
        const proof = hypeProofs.get(event.id);
        if (!proof || proof.totalCheckins === 0) return false;
      }

      return true;
    });

    visibleEvents.forEach((event: Event) => {
      const lat = event.venue?.latitude ?? event.latitude;
      const lng = event.venue?.longitude ?? event.longitude;
      if (lat == null || lng == null || !mapRef.current) return;

      const isOwner = !!currentUser && currentUser.id === event.author.id;

      const hypeScore = calcHype({ event, proof: hypeProofs.get(event.id) }).score;
      const marker = L.marker([lat, lng], { icon: createMarkerIcon(event.category, hypeScore) })
        .addTo(mapRef.current)
        .on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          setDeleteConfirm(null);
          setClickMenu(null);
          setSelectedEvent(event);
        });

      // Clique direito no marker → confirmação de exclusão (só para o dono)
      if (isOwner) {
        marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          setSelectedEvent(null);
          setClickMenu(null);
          const containerPoint = mapRef.current!.latLngToContainerPoint(e.latlng);
          setDeleteConfirm({ event, x: containerPoint.x, y: containerPoint.y });
        });
      }

      markersRef.current.push(marker);
    });
  }, [events, currentUser, filters, hypeProofs]);

  function handleOpenCreateEvent() {
    if (!clickMenu) return;
    setSelectedPos({ lat: clickMenu.lat, lng: clickMenu.lng });
    setClickMenu(null);
    setShowCreateEvent(true);
  }

  async function handleCreateEvent(payload: CreateEventPayload) {
    await createEvent(payload);
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div id="map" className="w-full h-full z-0" />

      {/* Search + Filtros — topo centralizado */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg px-4 flex items-start gap-2">
        <div className="flex-1">
          <MapSearch map={mapRef} />
        </div>
        <MapFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Sidebar esquerda */}
      <div className="absolute top-0 left-0 h-full z-10">
        <Sidebar
          events={events}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onEventClick={event => { setSelectedEvent(event); setClickMenu(null); }}
          onCreateEventRequest={() => {
            // Abre modal de criação no centro do mapa atual
            if (mapRef.current) {
              const center = mapRef.current.getCenter();
              setSelectedPos({ lat: center.lat, lng: center.lng });
              setShowCreateEvent(true);
            }
          }}
        />
      </div>

      {/* Controles zoom/localização */}
      <div className="absolute right-4 bottom-16 z-10">
        <MapControls map={mapRef} geoStatus={geoStatus} onLocate={irParaMinhaLocalizacao} />
      </div>

      {/* Legenda compacta — apenas quando há filtro ativo */}
      {hasActiveFilters(filters) && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-background/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-border flex flex-col gap-1 max-w-[140px]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Filtros ativos</p>
            {[...filters.categories].map(cat => (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_CONFIG[cat].color }} />
                <span className="text-foreground/70">{CATEGORY_CONFIG[cat].label}</span>
              </div>
            ))}
            {filters.dataFiltro && <p className="text-[10px] text-muted-foreground">{new Date(filters.dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</p>}
            {filters.horaInicio && <p className="text-[10px] text-muted-foreground">A partir {filters.horaInicio}</p>}
            {filters.horaFim && <p className="text-[10px] text-muted-foreground">Até {filters.horaFim}</p>}
            {filters.apenasGratuitos && <p className="text-[10px] text-muted-foreground">Apenas gratuitos</p>}
          </div>
        </div>
      )}

      {/* Hint ao usuário não logado */}
      {!isLoggedIn && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-background/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-xs text-muted-foreground shadow">
            <a href="/login" className="text-foreground font-medium underline">Entre</a> para adicionar eventos
          </div>
        </div>
      )}

      {/* Menu de clique no mapa */}
      {clickMenu && (
        <MapClickMenu
          position={clickMenu}
          isLoggedIn={isLoggedIn}
          onCreateEvent={handleOpenCreateEvent}
          onClose={() => setClickMenu(null)}
        />
      )}

      {/* Modal criar evento */}
      {showCreateEvent && selectedPos && (
        <CreateEventModal
          lat={selectedPos.lat}
          lng={selectedPos.lng}
          onSubmit={handleCreateEvent}
          onClose={() => setShowCreateEvent(false)}
        />
      )}

      {/* Confirmação de exclusão por clique direito */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setDeleteConfirm(null)} />
          <div
            className="fixed z-30 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden w-52"
            style={{ left: deleteConfirm.x, top: deleteConfirm.y }}
          >
            <div
              className="px-4 py-3"
              style={{ background: 'linear-gradient(135deg, #ee2525 0%, #fdbb2d 100%)' }}
            >
              <p className="text-xs font-semibold text-white truncate">{deleteConfirm.event.title}</p>
              <p className="text-[10px] text-white/70 mt-0.5">Excluir este evento?</p>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <button
                onClick={async () => {
                  await deleteEvent(deleteConfirm.event.id);
                  setDeleteConfirm(null);
                }}
                className="w-full h-9 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Sim, excluir
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full h-9 bg-muted hover:bg-muted/70 text-foreground text-xs font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Painel de detalhes de evento */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailPanel
            event={selectedEvent}
            currentUserId={currentUser?.id ?? null}
            isFavorite={favorites.has(selectedEvent.id)}
            onToggleFavorite={toggleFavorite}
            onClose={() => setSelectedEvent(null)}
            onDelete={async (id) => { await deleteEvent(id); setSelectedEvent(null); }}
            onUpdate={async (id, payload: UpdateEventPayload) => {
              const updated = await updateEvent(id, payload);
              setSelectedEvent(updated);
              return updated;
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function Home() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <MapContent />
    </ThemeProvider>
  );
}
