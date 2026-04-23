import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

// ── Tipos espelhando o backend ─────────────────────────────────────────────

export interface DashboardOverview {
  totalEventos:   number;
  eventosAtivos:  number;
  emAndamento:    number;
  futuros:        number;
  encerrados:     number;
  totalViews:     number;
  totalCheckins:  number;
  boostsAtivos:   number;
  boostCredits:   number;
  plan:           'free' | 'pro';
  planExpiresAt:  string | null;
}

export interface DashboardROI {
  totalInvestido:  number;
  receitaEstimada: number;
  roiPercent:      number | null;
  pessoasGeradas:  number;
  gastoBoosts:     number;
  gastoAssinatura: number;
}

export interface EventMetrica {
  eventId:     string;
  title:       string;
  category:    string;
  date:        string;
  endDate:     string | null;
  isAtivo:     boolean;
  isBoosted:   boolean;
  views:       number;
  checkins:    number;
  pessoasAgora: number;
  hypeScore:   number;
  venue:       string | null;
  imageUrl:    string | null;
  price:       number;
}

export interface BoostAtivo {
  eventId:   string;
  title:     string;
  category:  string;
  boostType: string;
  expiresAt: string;
  paidAt:    string;
}

export interface DashboardHistorico {
  serieViews:    number[];
  serieCheckins: number[];
  labels:        string[];
}

export interface DashboardData {
  overview:    DashboardOverview;
  roi:         DashboardROI;
  metricas:    EventMetrica[];
  topEventos:  EventMetrica[];
  boostsAtivos: BoostAtivo[];
  historico:   DashboardHistorico;
}

export function useDashboard() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError('');
      const res = await api.get<{ success: boolean; data: DashboardData }>('/analytics/dashboard');
      setData(res.data.data);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    // Revalida a cada 60s (social proof muda em tempo real)
    const id = setInterval(fetch, 60_000);
    return () => clearInterval(id);
  }, [fetch]);

  return { data, loading, error, refetch: fetch, lastUpdate };
}
