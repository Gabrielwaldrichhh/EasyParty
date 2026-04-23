import { useState } from "react";
import { X, Pencil, Trash2, MapPin, Building2, CheckCircle } from "lucide-react";
import type { Venue, VenueType, Category, UpdateVenuePayload } from "../../types";

const VENUE_TYPE_CONFIG: Record<VenueType, { emoji: string; label: string }> = {
  NIGHTCLUB:   { emoji: '🎵', label: 'Balada' },
  BAR:         { emoji: '🍺', label: 'Bar' },
  RESTAURANT:  { emoji: '🍽️', label: 'Restaurante' },
  EVENT_SPACE: { emoji: '🏛️', label: 'Espaço de eventos' },
  OUTDOOR:     { emoji: '🌳', label: 'Ao ar livre' },
  PRIVATE:     { emoji: '🏠', label: 'Privado' },
  OTHER:       { emoji: '📍', label: 'Outro' },
};

const CATEGORY_CONFIG: Record<Category, { color: string; emoji: string; label: string }> = {
  PARTY:      { color: '#ee2525', emoji: '🎉', label: 'Festa' },
  EVENT:      { color: '#3b82f6', emoji: '📅', label: 'Evento' },
  RESTAURANT: { color: '#f59e0b', emoji: '🍽️', label: 'Restaurante' },
  GATHERING:  { color: '#10b981', emoji: '🤝', label: 'Reunião' },
};

interface Props {
  venue: Venue;
  currentUserId: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, payload: UpdateVenuePayload) => Promise<Venue>;
}

export function VenueDetailPanel({ venue, currentUserId, onClose, onDelete, onUpdate }: Props) {
  const isOwner = !!currentUserId && currentUserId === venue.owner.id;
  const typeCfg = VENUE_TYPE_CONFIG[venue.type] ?? VENUE_TYPE_CONFIG.OTHER;

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState({
    name: venue.name,
    description: venue.description ?? '',
    type: venue.type,
    address: venue.address ?? '',
    city: venue.city ?? '',
    state: venue.state ?? '',
  });

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onUpdate(venue.id, {
        name: form.name,
        description: form.description || undefined,
        type: form.type as VenueType,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
      });
      setMode('view');
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[360px] z-20 flex flex-col bg-background border-l border-border shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500 text-white flex items-center gap-1">
          <Building2 className="w-3 h-3" /> Local
        </span>
        <div className="flex items-center gap-1">
          {isOwner && mode === 'view' && (
            <>
              <button
                onClick={() => setMode('edit')}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 transition-colors text-muted-foreground hover:text-red-500"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {mode === 'view' ? (
          <>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{venue.name}</h2>
                {venue.isVerified && (
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" title="Local verificado" />
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 inline-block">
                {typeCfg.emoji} {typeCfg.label}
              </span>
              {venue.description && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{venue.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {(venue.address || venue.city || venue.state) && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {[venue.address, venue.city, venue.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground border-t border-border pt-2">
              por @{venue.owner.username}
            </div>

            {/* Eventos de hoje */}
            {venue.events && venue.events.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Eventos hoje</p>
                {venue.events.map(ev => {
                  const cfg = CATEGORY_CONFIG[ev.category] ?? CATEGORY_CONFIG.PARTY;
                  return (
                    <div key={ev.id} className="bg-muted/50 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base flex-shrink-0">{cfg.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {ev.endDate && ` – ${new Date(ev.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold flex-shrink-0" style={{ color: cfg.color }}>
                        {ev.price > 0 ? `R$ ${ev.price.toFixed(2)}` : 'Grátis'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {venue.events && venue.events.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum evento hoje neste local</p>
            )}

            {confirmDelete && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3 flex flex-col gap-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Excluir este local?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDelete(venue.id); onClose(); }}
                    className="flex-1 h-8 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Sim, excluir
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 h-8 bg-muted hover:bg-muted/70 text-foreground text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Modo edição */
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Editar local</h3>

            {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.entries(VENUE_TYPE_CONFIG) as [VenueType, typeof VENUE_TYPE_CONFIG[VenueType]][]).map(([key, c]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set('type', key)}
                    className="h-8 rounded-lg text-xs font-medium border transition-all"
                    style={form.type === key
                      ? { background: '#6366f1', color: 'white', borderColor: '#6366f1' }
                      : { background: 'transparent', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }
                    }
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Endereço</label>
              <input
                value={form.address}
                onChange={e => set('address', e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cidade</label>
                <input
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</label>
                <input
                  value={form.state}
                  onChange={e => set('state', e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 h-9 rounded-lg text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => { setMode('view'); setError(''); }}
                className="flex-1 h-9 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
