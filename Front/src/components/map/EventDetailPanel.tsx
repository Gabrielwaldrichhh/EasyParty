import { useState, useEffect } from "react";
import { X, Pencil, Trash2, MapPin, Clock, Users, Globe, Lock, ShieldAlert, Star, Rocket, Zap, Loader2, Navigation, Share2, Copy, Car, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { slideLeft } from "../../lib/motion";
import { CATEGORY_CONFIG } from "../../config/categories";
import { billingService, type BillingStatus } from "../../services/billingService";
import { authService } from "../../services/authService";
import { EventStatusBadge } from "../EventStatusBadge";
import { SocialProofBar } from "../SocialProofBar";
import { HypeBadge } from "../HypeBadge";
import { OrganizerAnalytics } from "../OrganizerAnalytics";
import { CheckinButton } from "../CheckinButton";
import type { Event, Category, UpdateEventPayload } from "../../types";

interface Props {
  event: Event;
  currentUserId: string | null;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, payload: UpdateEventPayload) => Promise<Event>;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function EventDetailPanel({ event, currentUserId, isFavorite, onToggleFavorite, onClose, onDelete, onUpdate }: Props) {
  const isOwner = !!currentUserId && currentUserId === event.author.id;
  const cfg = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.PARTY;

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Billing
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loadingBoost, setLoadingBoost] = useState(false);
  const [boostMsg, setBoostMsg] = useState('');

  useEffect(() => {
    if (!isOwner || !authService.isAuthenticated()) return;
    billingService.getStatus().then(setBillingStatus).catch(() => {});
  }, [isOwner]);

  const isBoosted = billingStatus?.boostsAtivos.some(b => b.eventId === event.id) ?? false;

  async function handleBoostAvulso() {
    setLoadingBoost(true);
    try { await billingService.startBoostAvulso(event.id); }
    catch (e: any) { setBoostMsg(e.response?.data?.message ?? 'Erro ao iniciar pagamento'); }
    finally { setLoadingBoost(false); }
  }

  async function handleBoostCredito() {
    setLoadingBoost(true);
    setBoostMsg('');
    try {
      await billingService.boostWithCredit(event.id);
      // Atualiza status local
      const updated = await billingService.getStatus();
      setBillingStatus(updated);
      setBoostMsg('Evento em destaque por 7 dias!');
    } catch (e: any) {
      setBoostMsg(e.response?.data?.message ?? 'Erro ao usar crédito');
    } finally {
      setLoadingBoost(false);
    }
  }

  const address = event.address ?? event.venue?.address;

  // "Ir agora" — menu de opções de navegação
  const [navOpen, setNavOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const lat = event.venue?.latitude ?? event.latitude;
  const lng = event.venue?.longitude ?? event.longitude;
  const hasCoords = lat != null && lng != null;
  const coordStr = hasCoords ? `${lat},${lng}` : null;
  const addressStr = address ?? (hasCoords ? `${lat},${lng}` : null);

  function openGoogleMaps() {
    const dest = coordStr ?? encodeURIComponent(addressStr ?? event.title);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
    setNavOpen(false);
  }
  function openUber() {
    const dest = coordStr ?? '0,0';
    const [dlat, dlng] = dest.split(',');
    window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${dlat}&dropoff[longitude]=${dlng}&dropoff[nickname]=${encodeURIComponent(event.title)}`, '_blank');
    setNavOpen(false);
  }
  function copyAddress() {
    const text = addressStr ?? event.title;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setNavOpen(false);
  }
  async function shareEvent() {
    const text = `${event.title} — ${addressStr ?? ''}\nVeja no EasyParty`;
    if (navigator.share) {
      await navigator.share({ title: event.title, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
    }
  }

  const [form, setForm] = useState({
    title: event.title,
    description: event.description ?? '',
    category: event.category,
    customCategory: event.customCategory ?? '',
    hora: fmt(event.date),
    horaFim: event.endDate ? fmt(event.endDate) : '',
    price: event.price.toString(),
    address: event.address ?? event.venue?.address ?? '',
    isPublic: event.isPublic,
    minAge: event.minAge != null ? String(event.minAge) : '',
  });

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const baseDate = new Date(event.date);
      const [hh, mm] = form.hora.split(':').map(Number);
      baseDate.setHours(hh, mm, 0, 0);

      let endDate: string | null | undefined = undefined;
      if (form.horaFim) {
        const end = new Date(event.date);
        const [ehh, emm] = form.horaFim.split(':').map(Number);
        end.setHours(ehh, emm, 0, 0);
        endDate = end.toISOString();
      } else {
        endDate = null;
      }

      await onUpdate(event.id, {
        title: form.title,
        description: form.description || undefined,
        category: form.category as Category,
        customCategory: form.category === 'OTHER' ? form.customCategory : undefined,
        date: baseDate.toISOString(),
        endDate,
        price: parseFloat(form.price) || 0,
        address: form.address || undefined,
        isPublic: form.isPublic,
        minAge: form.minAge ? parseInt(form.minAge) : null,
      });
      setMode('view');
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed right-0 top-0 h-full w-full sm:w-[420px] z-20 flex flex-col bg-background border-l border-border shadow-2xl"
      variants={slideLeft}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
          style={{ background: cfg.color }}
        >
          {cfg.emoji} {event.category === 'OTHER' && event.customCategory ? event.customCategory : cfg.label}
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

      {/* Status em tempo real */}
      <EventStatusBadge
        startDate={event.date}
        endDate={event.endDate}
        size="lg"
      />

      {/* Prova social */}
      <SocialProofBar eventId={event.id} registerView />

      {/* Check-in — só durante o evento (não para o dono, que já tem analytics) */}
      {!isOwner && mode === 'view' && (() => {
        const now = Date.now();
        const start = new Date(event.date).getTime();
        const end   = event.endDate
          ? new Date(event.endDate).getTime()
          : start + 3 * 60 * 60 * 1000;
        const isActiveWindow = now >= start - 30 * 60 * 1000 && now < end; // começa 30min antes
        return isActiveWindow ? (
          <div className="px-4 pt-2">
            <CheckinButton eventId={event.id} />
          </div>
        ) : null;
      })()}

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-4 pb-28 flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}>
        {mode === 'view' ? (
          <>
            <div>
              <div className="flex items-start gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground leading-tight flex-1">{event.title}</h2>
                <HypeBadge event={event} proof={null} isBoosted={isBoosted} size="md" className="mt-0.5 flex-shrink-0" />
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{event.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  {fmt(event.date)}
                  {event.endDate && ` → ${fmt(event.endDate)}`}
                </span>
              </div>
              {address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {event.isPublic ? <Globe className="w-4 h-4 flex-shrink-0" /> : <Lock className="w-4 h-4 flex-shrink-0" />}
                <span>{event.isPublic ? 'Evento público' : 'Evento privado'}</span>
              </div>
              {event.maxCapacity && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>Capacidade: {event.maxCapacity}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                {event.minAge && event.minAge > 0 ? (
                  <span
                    className="font-semibold px-2 py-0.5 rounded-full text-xs text-white"
                    style={{ background: event.minAge >= 18 ? '#ef4444' : event.minAge >= 16 ? '#f97316' : '#f59e0b' }}
                  >
                    {event.minAge}+
                  </span>
                ) : (
                  <span className="text-muted-foreground">Livre para todos</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm font-bold" style={{ color: cfg.color }}>
                {event.price > 0 ? `R$ ${event.price.toFixed(2)}` : 'Gratuito'}
              </span>
              <span className="text-xs text-muted-foreground">por @{event.author.username}</span>
            </div>

            {/* Analytics — só para o dono */}
            {isOwner && (
              <OrganizerAnalytics eventId={event.id} isBoosted={isBoosted} />
            )}

            {/* Seção Turbinar — só para o dono */}
            {isOwner && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-3 py-2.5 flex items-center gap-2"
                  style={{ background: isBoosted ? '#10b98115' : '#ee252510' }}>
                  <Rocket className="w-4 h-4 flex-shrink-0" style={{ color: isBoosted ? '#10b981' : '#ee2525' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {isBoosted ? 'Evento em destaque' : 'Turbinar este evento'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {isBoosted
                        ? `Expira em ${new Date(billingStatus!.boostsAtivos.find(b => b.eventId === event.id)!.expiresAt).toLocaleDateString('pt-BR')}`
                        : 'Apareça em destaque no mapa e no topo das listas'
                      }
                    </p>
                  </div>
                  {isBoosted && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-emerald-500">
                      Ativo
                    </span>
                  )}
                </div>

                {!isBoosted && (
                  <div className="p-2.5 flex flex-col gap-2">
                    {boostMsg && (
                      <p className="text-[10px] rounded-lg px-2 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        {boostMsg}
                      </p>
                    )}

                    {/* Botão crédito Pro */}
                    {billingStatus?.plan === 'pro' && (billingStatus?.boostCredits ?? 0) > 0 && (
                      <button
                        onClick={handleBoostCredito}
                        disabled={loadingBoost}
                        className="w-full h-9 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                      >
                        {loadingBoost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        Usar crédito Pro ({billingStatus.boostCredits} restantes)
                      </button>
                    )}

                    {/* Botão avulso */}
                    <button
                      onClick={handleBoostAvulso}
                      disabled={loadingBoost}
                      className="w-full h-9 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                      style={{ background: '#ee2525' }}
                    >
                      {loadingBoost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                      Turbinar por R$ 9,99
                    </button>

                    {billingStatus?.plan !== 'pro' && (
                      <p className="text-[9px] text-muted-foreground text-center">
                        Plano Pro: turbine até 5 eventos por R$ 29,99/mês
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {confirmDelete && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3 flex flex-col gap-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Excluir este evento?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDelete(event.id); onClose(); }}
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
            <h3 className="text-sm font-semibold text-foreground">Editar evento</h3>

            {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Título</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoria</label>
              <div className="grid grid-cols-5 gap-1">
                {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, c]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set('category', key as Category)}
                    className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl border transition-all"
                    style={form.category === key
                      ? { borderColor: c.color, background: c.color + '22' }
                      : { borderColor: 'var(--border)' }
                    }
                    title={c.label}
                  >
                    <span className="text-base leading-none">{c.emoji}</span>
                    <span className="text-[8px] text-muted-foreground">{c.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.category === 'OTHER' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descreva o tipo</label>
                <input
                  value={form.customCategory}
                  onChange={e => set('customCategory', e.target.value)}
                  placeholder="Ex: Corrida, Leilão, Feira..."
                  maxLength={50}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Início</label>
                <input
                  type="time"
                  value={form.hora}
                  onChange={e => set('hora', e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fim</label>
                <input
                  type="time"
                  value={form.horaFim}
                  onChange={e => set('horaFim', e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preço (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-ring"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visibilidade</label>
                <button
                  type="button"
                  onClick={() => set('isPublic', !form.isPublic)}
                  className="h-9 px-3 rounded-lg border border-border text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  style={form.isPublic ? { background: '#10b981', color: 'white', borderColor: '#10b981' } : {}}
                >
                  {form.isPublic ? <><Globe className="w-3 h-3" /> Público</> : <><Lock className="w-3 h-3" /> Privado</>}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Faixa etária
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { label: 'Livre', value: '' },
                  { label: '10+', value: '10' },
                  { label: '14+', value: '14' },
                  { label: '16+', value: '16' },
                  { label: '18+', value: '18' },
                  { label: '21+', value: '21' },
                ].map(op => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => set('minAge', op.value)}
                    className="h-7 px-2.5 rounded-xl border text-xs font-semibold transition-all"
                    style={form.minAge === op.value
                      ? { background: cfg.color, color: 'white', borderColor: cfg.color }
                      : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                    }
                  >
                    {op.label}
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

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="flex-1 h-9 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: cfg.color }}
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

      {/* ── Rodapé fixo — "Ir agora" ──────────────────────────────────────── */}
      {mode === 'view' && (
        <div className="flex-shrink-0 border-t border-border bg-background">
          {/* Menu de opções — expande para cima */}
          {navOpen && (
            <div className="px-4 pt-3 pb-1 flex flex-col gap-1.5 border-b border-border/50">
              <button
                onClick={openGoogleMaps}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Google Maps</p>
                  <p className="text-[10px] text-muted-foreground">Abrir rota até o local</p>
                </div>
              </button>

              <button
                onClick={openUber}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                  <Car className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Chamar Uber</p>
                  <p className="text-[10px] text-muted-foreground">Ir direto para o evento</p>
                </div>
              </button>

              <button
                onClick={copyAddress}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {copied ? 'Copiado!' : 'Copiar endereço'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                    {addressStr ?? 'Endereço do evento'}
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Barra de ações */}
          <div className="px-4 py-3 flex items-center gap-2">
            {/* Botão principal — "Ir agora" */}
            <button
              onClick={() => setNavOpen(o => !o)}
              className="flex-1 h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ee2525, #f97316)', boxShadow: '0 4px 16px #ee252540' }}
            >
              <Navigation className="w-4 h-4" />
              Ir agora
              <ChevronUp
                className="w-3.5 h-3.5 transition-transform"
                style={{ transform: navOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {/* Ações secundárias */}
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(event.id)}
                className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
                title={isFavorite ? 'Remover dos favoritos' : 'Salvar'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
              </button>
            )}
            <button
              onClick={shareEvent}
              className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
