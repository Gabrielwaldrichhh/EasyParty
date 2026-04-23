import { useState } from "react";
import { SlidersHorizontal, X, Clock, CalendarDays, Tag, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeDown, dur, ease } from "../../lib/motion";
import { CATEGORY_CONFIG } from "../../config/categories";
import type { Category } from "../../types";

export interface FilterState {
  categories:      Set<Category>;
  dataFiltro:      string;         // YYYY-MM-DD
  horaInicio:      string;         // HH:mm
  horaFim:         string;         // HH:mm
  proximasHoras:   number | null;  // null = sem filtro, 0 = agora, 1/3/6/12/24
  apenasGratuitos: boolean;
  precoMax:        number | null;  // null = sem limite
  apenasComCheckin:boolean;
}

export function defaultFilters(): FilterState {
  return {
    categories:       new Set<Category>(),
    dataFiltro:       '',
    horaInicio:       '',
    horaFim:          '',
    proximasHoras:    null,
    apenasGratuitos:  false,
    precoMax:         null,
    apenasComCheckin: false,
  };
}

export function hasActiveFilters(f: FilterState) {
  return (
    f.categories.size > 0 ||
    !!f.dataFiltro ||
    !!f.horaInicio ||
    !!f.horaFim ||
    f.proximasHoras !== null ||
    f.apenasGratuitos ||
    f.precoMax !== null ||
    f.apenasComCheckin
  );
}

function countActive(f: FilterState) {
  let n = 0;
  if (f.categories.size > 0)   n++;
  if (f.dataFiltro)             n++;
  if (f.horaInicio || f.horaFim) n++;
  if (f.proximasHoras !== null) n++;
  if (f.apenasGratuitos)        n++;
  if (f.precoMax !== null)      n++;
  if (f.apenasComCheckin)       n++;
  return n;
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

const TODAS_CATS = Object.keys(CATEGORY_CONFIG) as Category[];

// Chips de "quando" — arrastar ou clicar
const QUANDO_CHIPS: { label: string; horas: number; emoji: string }[] = [
  { label: 'Agora',   horas: 0,  emoji: '🔴' },
  { label: '1 hora',  horas: 1,  emoji: '⚡' },
  { label: '3 horas', horas: 3,  emoji: '🕐' },
  { label: '6 horas', horas: 6,  emoji: '🌅' },
  { label: 'Hoje',    horas: 12, emoji: '📅' },
  { label: 'Amanhã',  horas: 24, emoji: '🌙' },
];

// Toggle simples reutilizável
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex-shrink-0 w-10 h-5 rounded-full transition-colors relative"
      style={{ background: on ? '#ee2525' : 'var(--muted)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  );
}

export function MapFilters({ filters, onChange }: Props) {
  const [aberto, setAberto] = useState(false);
  const ativo  = hasActiveFilters(filters);
  const count  = countActive(filters);

  function toggleCat(cat: Category) {
    const next = new Set(filters.categories);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    onChange({ ...filters, categories: next });
  }

  function setQuando(horas: number) {
    // Toggle: clicar no mesmo chip remove o filtro
    onChange({
      ...filters,
      proximasHoras: filters.proximasHoras === horas ? null : horas,
      // Se escolher chip de tempo, limpa filtros manuais de hora/data que conflitam
      dataFiltro: filters.proximasHoras === horas ? filters.dataFiltro : '',
      horaInicio: filters.proximasHoras === horas ? filters.horaInicio : '',
      horaFim:    filters.proximasHoras === horas ? filters.horaFim    : '',
    });
  }

  function limpar() {
    onChange(defaultFilters());
  }

  return (
    <div className="relative">
      {/* Botão trigger */}
      <motion.button
        onClick={() => setAberto(a => !a)}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-1.5 h-11 px-3.5 rounded-2xl border border-border bg-background/95 backdrop-blur-sm shadow text-sm font-medium transition-all hover:bg-accent"
        style={ativo ? { borderColor: '#ee2525', color: '#ee2525' } : {}}
      >
        <motion.div animate={{ rotate: aberto ? 90 : 0 }} transition={{ duration: dur.fast, ease: ease.out }}>
          <SlidersHorizontal className="w-4 h-4" />
        </motion.div>
        <span className="hidden sm:inline">Filtros</span>
        {ativo && (
          <span
            className="w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ background: '#ee2525' }}
          >
            {count}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            className="fixed inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.fast }}
            onClick={() => setAberto(false)}
          />

          <motion.div
            className="fixed top-16 right-2 z-20 bg-background/98 backdrop-blur-md border border-border rounded-2xl shadow-2xl flex flex-col"
            style={{ width: 'min(320px, calc(100vw - 16px))', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', overflowX: 'hidden' }}
            variants={fadeDown}
            initial="initial"
            animate="animate"
            exit="exit"
          >

            {/* Header */}
            <div className="sticky top-0 bg-background/98 backdrop-blur-sm px-4 py-3 border-b border-border flex items-center justify-between z-10">
              <span className="text-sm font-bold text-foreground">Filtrar eventos</span>
              <div className="flex items-center gap-2">
                {ativo && (
                  <button onClick={limpar} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <X className="w-3 h-3" /> Limpar
                  </button>
                )}
                <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-5">

              {/* ── Quando — chips de arrastar ────────────────────────────── */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Quando
                </p>
                <div className="flex gap-2 flex-wrap">
                  {QUANDO_CHIPS.map(chip => {
                    const sel = filters.proximasHoras === chip.horas;
                    return (
                      <button
                        key={chip.horas}
                        type="button"
                        onClick={() => setQuando(chip.horas)}
                        className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border transition-all text-center"
                        style={sel
                          ? { borderColor: '#ee2525', background: '#ee252518', color: '#ee2525' }
                          : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                        }
                      >
                        <span className="text-base leading-none">{chip.emoji}</span>
                        <span className="text-[10px] font-semibold whitespace-nowrap">{chip.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {filters.proximasHoras === 0
                    ? 'Eventos acontecendo agora'
                    : filters.proximasHoras !== null
                    ? `Eventos nas próximas ${filters.proximasHoras}h`
                    : 'Arraste ou clique para filtrar por tempo'
                  }
                </p>
              </div>

              {/* ── Categorias ────────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tipo de evento
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {TODAS_CATS.map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const sel = filters.categories.has(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCat(cat)}
                        className="flex flex-col items-center gap-0.5 py-2 rounded-xl border transition-all"
                        style={sel
                          ? { borderColor: cfg.color, background: cfg.color + '22' }
                          : { borderColor: 'var(--border)' }
                        }
                        title={cfg.label}
                      >
                        <span className="text-base leading-none">{cfg.emoji}</span>
                        <span className="text-[8px] text-muted-foreground leading-tight">{cfg.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Data específica ───────────────────────────────────────── */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Data específica
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.dataFiltro}
                    onChange={e => onChange({ ...filters, dataFiltro: e.target.value, proximasHoras: null })}
                    className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:border-ring"
                  />
                  {filters.dataFiltro && (
                    <button type="button" onClick={() => onChange({ ...filters, dataFiltro: '' })}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Horário manual ────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Faixa de horário
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-muted-foreground">A partir de</label>
                    <input
                      type="time"
                      value={filters.horaInicio}
                      onChange={e => onChange({ ...filters, horaInicio: e.target.value, proximasHoras: null })}
                      className="h-9 px-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:border-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-muted-foreground">Até</label>
                    <input
                      type="time"
                      value={filters.horaFim}
                      onChange={e => onChange({ ...filters, horaFim: e.target.value, proximasHoras: null })}
                      className="h-9 px-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:border-ring"
                    />
                  </div>
                </div>
              </div>

              {/* ── Preço máximo ──────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  Preço máximo
                  {filters.precoMax !== null && (
                    <span className="ml-auto text-xs font-bold" style={{ color: '#ee2525' }}>
                      {filters.precoMax === 0 ? 'Gratuito' : `R$ ${filters.precoMax}`}
                    </span>
                  )}
                </p>
                {/* Chips de preço rápido */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Gratuito', val: 0 },
                    { label: 'Até R$20', val: 20 },
                    { label: 'Até R$50', val: 50 },
                    { label: 'Até R$100', val: 100 },
                  ].map(op => {
                    const sel = filters.precoMax === op.val;
                    return (
                      <button
                        key={op.val}
                        type="button"
                        onClick={() => onChange({ ...filters, precoMax: sel ? null : op.val, apenasGratuitos: op.val === 0 ? !sel : false })}
                        className="px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
                        style={sel
                          ? { borderColor: '#ee2525', background: '#ee252518', color: '#ee2525' }
                          : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                        }
                      >
                        {op.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Toggles ───────────────────────────────────────────────── */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Apenas gratuitos</p>
                    <p className="text-[10px] text-muted-foreground">Sem custo de entrada</p>
                  </div>
                  <Toggle
                    on={filters.apenasGratuitos}
                    onToggle={() => onChange({ ...filters, apenasGratuitos: !filters.apenasGratuitos, precoMax: !filters.apenasGratuitos ? 0 : filters.precoMax })}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      Com check-ins
                    </p>
                    <p className="text-[10px] text-muted-foreground">Presença confirmada por usuários</p>
                  </div>
                  <Toggle
                    on={filters.apenasComCheckin}
                    onToggle={() => onChange({ ...filters, apenasComCheckin: !filters.apenasComCheckin })}
                  />
                </div>

              </div>

            </div>

            {/* Footer sticky */}
            {ativo && (
              <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm px-4 py-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => { limpar(); setAberto(false); }}
                  className="w-full h-9 rounded-xl border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar todos os filtros
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
      </AnimatePresence>
    </div>
  );
}
