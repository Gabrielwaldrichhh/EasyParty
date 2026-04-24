/**
 * FervoMap Motion System
 * Design tokens de animação — single source of truth para toda a UI.
 * Pense: Apple HIG + Linear + Vercel — sofisticado, rápido, nunca exagerado.
 */

// ── Durations ────────────────────────────────────────────────────────────────
export const dur = {
  instant: 0.08,   // Feedback imediato (press scale, ripple start)
  fast:    0.12,   // Microinterações (hover, ícones, badges)
  normal:  0.22,   // Transições de estado (tabs, filtros, botões)
  smooth:  0.35,   // Entrada de painéis, modais
  slow:    0.5,    // Page transitions, grandes mudanças de layout
} as const;

// ── Easings ──────────────────────────────────────────────────────────────────
export const ease = {
  // Standard — suave e natural para a maioria dos casos
  out:      [0.0, 0.0, 0.2, 1.0]   as [number,number,number,number],
  // Entrada expressiva — começa rápido, desacelera com confiança
  outExpo:  [0.16, 1, 0.3, 1]      as [number,number,number,number],
  // Saída — começar devagar, sair com velocidade
  inOut:    [0.4, 0, 0.2, 1]       as [number,number,number,number],
  // Snappy — crisp para feedback de clique
  snappy:   [0.2, 0, 0, 1]         as [number,number,number,number],
} as const;

// ── Spring presets ────────────────────────────────────────────────────────────
// Usados para interações físicas — drag, modais, sidebars
export const spring = {
  // Feedback de clique/press — instantâneo, sem oscilação
  press: {
    type: 'spring' as const,
    stiffness: 700,
    damping: 35,
    mass: 0.5,
  },
  // Entrada de painéis e modais — natural, elegante
  panel: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 32,
    mass: 0.9,
  },
  // Overlay e fade — suave
  overlay: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  // Bounce leve — badges, notificações, novidades
  popIn: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 22,
    mass: 0.6,
  },
} as const;

// ── Variantes reutilizáveis ───────────────────────────────────────────────────

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: dur.normal, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: dur.fast,   ease: ease.inOut } },
};

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0,  transition: { duration: dur.smooth, ease: ease.outExpo } },
  exit:    { opacity: 0, y: 8,  transition: { duration: dur.fast,   ease: ease.inOut } },
};

export const fadeDown = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0,   transition: { duration: dur.smooth, ease: ease.outExpo } },
  exit:    { opacity: 0, y: -8,  transition: { duration: dur.fast,   ease: ease.inOut } },
};

export const slideRight = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0,   transition: spring.panel },
  exit:    { opacity: 0, x: -16, transition: { duration: dur.normal, ease: ease.inOut } },
};

export const slideLeft = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0,  transition: spring.panel },
  exit:    { opacity: 0, x: 16, transition: { duration: dur.normal, ease: ease.inOut } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.93 },
  animate: { opacity: 1, scale: 1,    transition: { duration: dur.smooth, ease: ease.outExpo } },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: dur.fast,   ease: ease.inOut } },
};

// Bottom sheet — entra de baixo para cima (mobile)
export const sheetUp = {
  initial: { y: '100%', opacity: 0.8 },
  animate: { y: 0,       opacity: 1,   transition: spring.panel },
  exit:    { y: '100%', opacity: 0,   transition: { duration: dur.normal, ease: ease.inOut } },
};

// Stagger para listas
export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.smooth, ease: ease.outExpo } },
};
