import type { Category } from '../types';

export const CATEGORY_CONFIG: Record<Category, { color: string; emoji: string; label: string }> = {
  PARTY:      { color: '#ee2525', emoji: '🎉', label: 'Festa' },
  SHOW:       { color: '#8b5cf6', emoji: '🎤', label: 'Show' },
  SPORTS:     { color: '#10b981', emoji: '⚽', label: 'Esporte' },
  ESPORTS:    { color: '#06b6d4', emoji: '🎮', label: 'E-Sports' },
  FESTIVAL:   { color: '#f59e0b', emoji: '🎪', label: 'Festival' },
  THEATER:    { color: '#ec4899', emoji: '🎭', label: 'Teatro' },
  WORKSHOP:   { color: '#0ea5e9', emoji: '🛠️', label: 'Workshop' },
  GASTRONOMY: { color: '#f97316', emoji: '🍽️', label: 'Gastronomia' },
  NETWORKING: { color: '#3b82f6', emoji: '🤝', label: 'Networking' },
  RELIGIOUS:  { color: '#a78bfa', emoji: '✝️', label: 'Religioso' },
  OTHER:      { color: '#6b7280', emoji: '📌', label: 'Outro' },
};
