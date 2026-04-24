import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import {
  LogOut, Menu, HandHeart, PartyPopper, Star,
  Sun, Moon, UserCircle2, Rocket, X, ChevronRight, BarChart2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Profile } from "../profile";
import { ParaVocePanel } from "./panels/ParaVocePanel";
import { SuasFestasPanel } from "./panels/SuasFestasPanel";
import { FavoritosPanel } from "./panels/FavoritosPanel";
import { PlanosPanel } from "./panels/PlanosPanel";
import { useTheme } from "../theme-provider";
import { useAuth } from "../../hooks/useAuth";
import { slideRight, dur, ease } from "../../lib/motion";
import logo from "../../img/logoo-new-png.png";
import type { Event } from "../../types";

type PanelId = 'para-voce' | 'suas-festas' | 'favoritos' | 'planos' | null;

interface Props {
  events: Event[];
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onEventClick: (event: Event) => void;
  onCreateEventRequest: () => void;
}

const NAV_ITEMS: { id: PanelId; icon: React.ElementType; label: string; badge?: string }[] = [
  { id: 'para-voce',   icon: HandHeart,   label: 'Para você' },
  { id: 'suas-festas', icon: PartyPopper, label: 'Suas festas' },
  { id: 'favoritos',   icon: Star,        label: 'Favoritos' },
  { id: 'planos',      icon: Rocket,      label: 'Planos', badge: 'novo' },
];

export function Sidebar({ events, favorites, onToggleFavorite, onEventClick, onCreateEventRequest }: Props) {
  const [aberta, setAberta] = useState(false);
  const [painelAtivo, setPainelAtivo] = useState<PanelId>(null);
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  function togglePanel(id: PanelId) {
    if (painelAtivo === id) {
      setPainelAtivo(null);
    } else {
      setPainelAtivo(id);
      setAberta(true);
    }
  }

  function fecharPainel() {
    setPainelAtivo(null);
  }

  const PANEL_TITLES: Record<NonNullable<PanelId>, string> = {
    'para-voce':   'Para você',
    'suas-festas': 'Suas festas',
    'favoritos':   'Favoritos',
    'planos':      'Planos',
  };

  return (
    <>
      {/* Sidebar estreita */}
      <motion.div
        animate={{ width: aberta ? 224 : 64 }}
        transition={{ duration: dur.normal, ease: ease.outExpo }}
        className="h-full flex flex-col relative shadow-2xl z-20 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #ee2525 0%, #f5621a 50%, #fdbb2d 100%)' }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        {/* Topo */}
        <div className="relative flex items-center h-16 px-3 gap-3 flex-shrink-0">
          <button
            onClick={() => setAberta(a => !a)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-white flex-shrink-0"
          >
            <motion.div
              animate={{ rotate: aberta ? 90 : 0 }}
              transition={{ duration: dur.fast, ease: ease.out }}
            >
              <Menu className="w-4 h-4" />
            </motion.div>
          </button>
          <AnimatePresence>
            {aberta && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: dur.fast, ease: ease.out }}
                className="flex items-center gap-2.5 overflow-hidden"
              >
                <img src={logo} alt="" className="w-7 h-7 rounded-full border-2 border-white/40 flex-shrink-0" />
                <span className="font-bold text-base text-white whitespace-nowrap tracking-wide">FervoMap</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative mx-3 h-px bg-white/20" />

        {/* Navegação */}
        <nav className="relative flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map(({ id, icon: Icon, label, badge }) => {
            const ativo = painelAtivo === id;
            return (
              <motion.button
                key={id}
                onClick={() => togglePanel(id)}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors w-full text-left relative"
                style={ativo
                  ? { background: 'rgba(0,0,0,0.25)', color: 'white' }
                  : { color: 'rgba(255,255,255,0.8)' }
                }
                whileTap={{ scale: 0.96 }}
                onMouseEnter={e => { if (!ativo) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { if (!ativo) (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence>
                  {aberta && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: dur.fast, ease: ease.out }}
                      className="text-sm font-medium whitespace-nowrap flex-1"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {aberta && badge && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/25 text-white uppercase tracking-wide"
                    >
                      {badge}
                    </motion.span>
                  )}
                </AnimatePresence>
                {aberta && ativo && <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />}
                {!aberta && badge && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="relative mx-3 h-px bg-white/20 mb-2" />

        {/* Rodapé */}
        <div className="relative p-2 flex flex-col gap-1 flex-shrink-0">
          {/* Dashboard */}
          {user && (
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-white/20 transition-colors text-white/80 hover:text-white w-full text-left"
            >
              <BarChart2 className="w-4 h-4 flex-shrink-0" />
              {aberta && <span className="text-sm font-medium whitespace-nowrap">Dashboard</span>}
            </motion.button>
          )}

          {/* Tema */}
          <motion.button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-white/20 transition-colors text-white/80 hover:text-white w-full text-left"
          >
            {isDark ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
            {aberta && <span className="text-sm font-medium whitespace-nowrap">{isDark ? 'Modo claro' : 'Modo escuro'}</span>}
          </motion.button>

          {/* Avatar → perfil */}
          <Dialog>
            <DialogTrigger asChild>
              <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl mt-1 bg-black/15 cursor-pointer hover:bg-black/25 transition-colors">
                <Avatar className="flex-shrink-0">
                  <AvatarImage
                    src={user?.avatarUrl ?? undefined}
                    className="w-7 h-7 rounded-full border-2 border-white/40 object-cover"
                  />
                  <AvatarFallback className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs text-white font-bold">
                    {user?.username?.[0]?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                {aberta && (
                  <>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm text-white font-medium truncate">
                        {user?.displayName ?? user?.username ?? 'Usuário'}
                      </p>
                      <p className="text-[10px] text-white/60 flex items-center gap-0.5">
                        <UserCircle2 className="w-2.5 h-2.5" /> Ver perfil
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); logout(); }}
                      title="Sair"
                      className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto p-5">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Meu perfil</DialogTitle>
              </DialogHeader>
              <Profile />
            </DialogContent>
          </Dialog>

          {!aberta && (
            <motion.button
              onClick={logout}
              whileTap={{ scale: 0.96 }}
              title="Sair"
              className="flex items-center justify-center w-9 h-9 mx-auto rounded-xl hover:bg-white/20 transition-colors text-white/60 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        <div className="h-3" />
      </motion.div>

      {/* Painel lateral deslizante */}
      <AnimatePresence>
        {painelAtivo && (
          <>
            {/* Overlay para fechar */}
            <motion.div
              className="fixed inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur.fast }}
              onClick={fecharPainel}
            />
            <motion.div
              className="fixed top-0 h-full z-10 flex flex-col shadow-2xl border-r border-border"
              style={{
                left: aberta ? '224px' : '64px',
                width: '320px',
                background: 'var(--background)',
              }}
              variants={slideRight}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Cabeçalho do painel */}
              <div
                className="flex items-center justify-between px-4 h-16 flex-shrink-0 border-b border-border"
                style={{ background: 'linear-gradient(135deg, #ee252515, #fdbb2d15)' }}
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const item = NAV_ITEMS.find(n => n.id === painelAtivo);
                    if (!item) return null;
                    const Icon = item.icon;
                    return <Icon className="w-4 h-4" style={{ color: '#ee2525' }} />;
                  })()}
                  <h2 className="text-sm font-bold text-foreground">{PANEL_TITLES[painelAtivo]}</h2>
                </div>
                <motion.button
                  onClick={fecharPainel}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Conteúdo do painel */}
              <div className="flex-1 overflow-y-auto px-4 pt-4">
                {painelAtivo === 'para-voce' && (
                  <ParaVocePanel
                    events={events}
                    onEventClick={e => { onEventClick(e); fecharPainel(); }}
                  />
                )}
                {painelAtivo === 'suas-festas' && (
                  <SuasFestasPanel
                    events={events}
                    currentUser={user}
                    onEventClick={e => { onEventClick(e); fecharPainel(); }}
                    onCreateClick={() => { onCreateEventRequest(); fecharPainel(); }}
                  />
                )}
                {painelAtivo === 'favoritos' && (
                  <FavoritosPanel
                    currentUser={user}
                    events={events}
                    favorites={favorites}
                    onToggleFavorite={onToggleFavorite}
                    onEventClick={e => { onEventClick(e); fecharPainel(); }}
                  />
                )}
                {painelAtivo === 'planos' && <PlanosPanel />}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
