import api from './api';

export interface BillingStatus {
  plan:          'free' | 'pro';
  planExpiresAt: string | null;
  boostCredits:  number;
  proBoostLimit: number;
  boostsAtivos:  { eventId: string; boostType: string; expiresAt: string }[];
}

export const billingService = {
  async getStatus(): Promise<BillingStatus> {
    const { data } = await api.get<{ success: boolean; data: BillingStatus }>('/billing/status');
    return data.data;
  },

  // Redireciona para checkout Stripe — pagamento único R$ 9,99
  async startBoostAvulso(eventId: string): Promise<void> {
    const { data } = await api.post<{ success: boolean; url: string }>('/billing/checkout-boost', { eventId });
    window.location.href = data.url;
  },

  // Redireciona para checkout Stripe — assinatura Pro R$ 29,99/mês
  async startProSubscription(): Promise<void> {
    const { data } = await api.post<{ success: boolean; url: string }>('/billing/checkout-pro');
    window.location.href = data.url;
  },

  // Usa 1 crédito Pro para turbinar evento (sem passar pelo Stripe)
  async boostWithCredit(eventId: string): Promise<void> {
    await api.post('/billing/boost-pro', { eventId });
  },

  // Abre portal de gerenciamento de assinatura
  async openPortal(): Promise<void> {
    const { data } = await api.post<{ success: boolean; url: string }>('/billing/portal');
    window.location.href = data.url;
  },
};
