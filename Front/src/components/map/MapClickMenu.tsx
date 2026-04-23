import { CalendarPlus, MapPin, X, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn, dur } from "../../lib/motion";
import type { MapClickPosition } from "../../types";

interface Props {
  position: MapClickPosition;
  isLoggedIn: boolean;
  onCreateEvent: () => void;
  onClose: () => void;
}

export function MapClickMenu({ position, isLoggedIn, onCreateEvent, onClose }: Props) {
  const MENU_WIDTH = 220;
  const MENU_HEIGHT = isLoggedIn ? 120 : 140;
  const OFFSET = 14;

  const viewW = window.innerWidth;
  const viewH = window.innerHeight;

  const left = position.screenX + MENU_WIDTH + OFFSET > viewW
    ? position.screenX - MENU_WIDTH - OFFSET
    : position.screenX + OFFSET;

  const top = position.screenY + MENU_HEIGHT + OFFSET > viewH
    ? position.screenY - MENU_HEIGHT - OFFSET
    : position.screenY + OFFSET;

  return (
    <AnimatePresence>
      <>
        <motion.div
          className="fixed inset-0 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur.fast }}
          onClick={onClose}
        />

        <motion.div
          className="fixed z-30 rounded-2xl shadow-2xl overflow-hidden"
          style={{ left, top, width: MENU_WIDTH }}
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Cabeçalho com gradiente */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #ee2525 0%, #fdbb2d 100%)' }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-white/80" />
              <span className="text-xs text-white/90 font-mono font-medium">
                {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              </span>
            </div>
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.9 }}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </motion.button>
          </div>

          {/* Corpo */}
          <div className="bg-background/97 backdrop-blur-sm">
            {isLoggedIn ? (
              <div className="p-2">
                <motion.button
                  onClick={onCreateEvent}
                  whileTap={{ scale: 0.97 }}
                  className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent transition-all text-left w-full"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #ee2525, #fdbb2d)' }}
                  >
                    <CalendarPlus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Adicionar evento</p>
                    <p className="text-xs text-muted-foreground">Marcar no mapa</p>
                  </div>
                </motion.button>
              </div>
            ) : (
              <div className="p-4 flex flex-col items-center gap-3 text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #ee2525, #fdbb2d)' }}
                >
                  <LogIn className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Entre para continuar</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Adicione eventos no mapa</p>
                </div>
                <a
                  href="/login"
                  className="w-full text-center text-sm font-semibold text-white py-2 rounded-xl transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #ee2525, #fdbb2d)' }}
                >
                  Entrar
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
