import api from './api';

export interface SocialProof {
  pessoasAgora: number;
  textoAgora: string;
  textoChegaram: string | null;
  visualizacoes: number;
  totalCheckins: number;
  isLive: boolean;
  isUpcoming: boolean;
}

export interface CheckinResult {
  success: boolean;
  alreadyCheckedIn: boolean;
  checkinCount: number;
  locationValidated: boolean;
  proof: SocialProof;
}

export const socialProofService = {
  /** Registra a abertura do detalhe do evento E retorna os números. */
  async recordView(eventId: string): Promise<SocialProof> {
    const { data } = await api.post<{ success: boolean; data: SocialProof }>(
      `/events/${eventId}/view`,
    );
    return data.data;
  },

  /** Busca os números sem registrar nova view (polling individual). */
  async getProof(eventId: string): Promise<SocialProof> {
    const { data } = await api.get<{ success: boolean; data: SocialProof }>(
      `/events/${eventId}/social-proof`,
    );
    return data.data;
  },

  /**
   * Faz check-in no evento. Tenta obter GPS; envia coordenadas se autorizado.
   * Anti-abuso: 1 check-in por sessão por evento (controlado no backend por IP/userId).
   */
  async checkin(eventId: string): Promise<CheckinResult> {
    let lat: number | undefined;
    let lng: number | undefined;

    // Tenta GPS com timeout de 3s — não bloqueia se negar
    try {
      const pos = await Promise.race([
        new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 })
        ),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500)),
      ]);
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS negado ou timeout — check-in sem validação de localização
    }

    const { data } = await api.post<CheckinResult>(`/events/${eventId}/checkin`, { lat, lng });
    return data;
  },

  /**
   * Busca os proofs de múltiplos eventos em UMA ÚNICA request.
   * Retorna Map<eventId, SocialProof>.
   */
  async getBatch(eventIds: string[]): Promise<Map<string, SocialProof>> {
    if (eventIds.length === 0) return new Map();
    const { data } = await api.post<{ success: boolean; data: Record<string, SocialProof> }>(
      '/events/social-proof/batch',
      { ids: eventIds },
    );
    return new Map(Object.entries(data.data));
  },
};
