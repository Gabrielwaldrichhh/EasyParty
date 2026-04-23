const stripe         = require('../config/stripe');
const billingService = require('../services/billingService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// POST /billing/boost-avulso — paga R$ 9,99 e turbina 1 evento (pagamento único)
async function checkoutBoostAvulso(req, res, next) {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ success: false, message: 'eventId obrigatório' });

    const result = await billingService.createBoostAvulsoCheckout({
      userId:     req.user.id,
      eventId,
      successUrl: `${FRONTEND_URL}/checkout/sucesso?type=boost&eventId=${eventId}`,
      cancelUrl:  `${FRONTEND_URL}/checkout/cancelado`,
    });

    res.json({ success: true, url: result.url });
  } catch (err) { next(err); }
}

// POST /billing/checkout-pro — assina plano Pro R$ 29,99/mês
async function checkoutPro(req, res, next) {
  try {
    const result = await billingService.createProSubscriptionCheckout({
      userId:     req.user.id,
      successUrl: `${FRONTEND_URL}/checkout/sucesso?type=pro`,
      cancelUrl:  `${FRONTEND_URL}/checkout/cancelado`,
    });

    res.json({ success: true, url: result.url });
  } catch (err) { next(err); }
}

// POST /billing/boost-pro — usa 1 crédito do plano Pro para turbinar um evento
async function boostComCredito(req, res, next) {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ success: false, message: 'eventId obrigatório' });

    const boost = await billingService.boostEventWithCredit({
      userId: req.user.id,
      eventId,
    });

    res.json({ success: true, data: boost });
  } catch (err) { next(err); }
}

// GET /billing/status — retorna plano atual, créditos e boosts ativos
async function billingStatus(req, res, next) {
  try {
    const status = await billingService.getBillingStatus(req.user.id);
    res.json({ success: true, data: status });
  } catch (err) { next(err); }
}

// POST /billing/portal — abre portal de gerenciamento de assinatura
async function billingPortal(req, res, next) {
  try {
    const returnUrl = `${FRONTEND_URL}/`;
    const result = await billingService.createBillingPortal({ userId: req.user.id, returnUrl });
    res.json({ success: true, url: result.url });
  } catch (err) { next(err); }
}

// POST /billing/webhook — recebe eventos do Stripe
async function webhook(req, res) {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Recusa a request se o secret não estiver configurado — evita aceitar
  // eventos não assinados em ambientes com variável faltando
  if (!secret || secret.startsWith('whsec_SUBSTITUA')) {
    console.error('STRIPE_WEBHOOK_SECRET não configurado — webhook rejeitado');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await billingService.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await billingService.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await billingService.handleSubscriptionDeleted(event.data.object);
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = {
  checkoutBoostAvulso,
  checkoutPro,
  boostComCredito,
  billingStatus,
  billingPortal,
  webhook,
};
