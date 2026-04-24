const stripe = require('../config/stripe');
const prisma  = require('../config/prisma');
const logger  = require('../config/logger');

// ─── Constantes de negócio ───────────────────────────────────────────────────

const PRO_BOOST_LIMIT = 5;   // créditos de boost que o plano Pro repõe a cada ciclo
const BOOST_DURATION_DAYS = 7;

// IDs dos preços no Stripe — definidos via .env após criação no Dashboard
function getPriceId(type) {
  const map = {
    boost_avulso: process.env.STRIPE_PRICE_BOOST_AVULSO, // pagamento único R$ 9,99
    pro:          process.env.STRIPE_PRICE_PRO,           // assinatura mensal R$ 29,99
  };
  const id = map[type];
  if (!id) throw Object.assign(
    new Error(`Preço "${type}" não configurado no .env`),
    { status: 400 }
  );
  return id;
}

// ─── Customer ────────────────────────────────────────────────────────────────

async function getOrCreateCustomer(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email:    user.email,
    name:     user.displayName ?? user.username,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: userId },
    data:  { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─── Checkout: Boost Avulso (pagamento único, 1 evento) ──────────────────────

async function createBoostAvulsoCheckout({ userId, eventId, successUrl, cancelUrl }) {
  // Valida que o evento existe e pertence ao usuário
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Object.assign(new Error('Evento não encontrado'), { status: 404 });
  if (event.authorId !== userId) throw Object.assign(new Error('Sem permissão'), { status: 403 });

  // Verifica se o evento já está turbinado e ativo
  const boostAtivo = await prisma.boostedEvent.findFirst({
    where: { eventId, expiresAt: { gt: new Date() } },
  });
  if (boostAtivo) throw Object.assign(new Error('Este evento já está em destaque'), { status: 409 });

  const customerId = await getOrCreateCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer:    customerId,
    mode:        'payment',
    line_items:  [{ price: getPriceId('boost_avulso'), quantity: 1 }],
    success_url: successUrl,
    cancel_url:  cancelUrl,
    metadata:    { userId, eventId, type: 'boost_avulso' },
  });

  return { url: session.url, sessionId: session.id };
}

// ─── Checkout: Plano Pro (assinatura recorrente) ─────────────────────────────

async function createProSubscriptionCheckout({ userId, successUrl, cancelUrl }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });
  if (user.stripePlan === 'pro') throw Object.assign(new Error('Já possui o plano Pro'), { status: 409 });

  const customerId = await getOrCreateCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'subscription',
    line_items: [{ price: getPriceId('pro'), quantity: 1 }],
    success_url: successUrl,
    cancel_url:  cancelUrl,
    metadata:    { userId, type: 'pro_subscription' },
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId, planId: 'pro' },
    },
  });

  logger.info('billing.checkout.pro.created', { userId, sessionId: session.id });
  return { url: session.url, sessionId: session.id };
}

// ─── Boost com crédito Pro ────────────────────────────────────────────────────

async function boostEventWithCredit({ userId, eventId }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });
  if (user.stripePlan !== 'pro') throw Object.assign(new Error('Plano Pro necessário'), { status: 403 });
  if (user.boostCredits <= 0) throw Object.assign(new Error('Sem créditos de boost disponíveis'), { status: 403 });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Object.assign(new Error('Evento não encontrado'), { status: 404 });
  if (event.authorId !== userId) throw Object.assign(new Error('Sem permissão'), { status: 403 });

  // Conta boosts ativos do usuário
  const boostsAtivos = await prisma.boostedEvent.count({
    where: { userId, expiresAt: { gt: new Date() } },
  });
  if (boostsAtivos >= PRO_BOOST_LIMIT) {
    throw Object.assign(
      new Error(`Limite de ${PRO_BOOST_LIMIT} eventos em destaque simultâneos atingido`),
      { status: 409 }
    );
  }

  const boostAtivo = await prisma.boostedEvent.findFirst({
    where: { eventId, expiresAt: { gt: new Date() } },
  });
  if (boostAtivo) throw Object.assign(new Error('Este evento já está em destaque'), { status: 409 });

  const expiresAt = new Date(Date.now() + BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // Transação: cria boost + desconta crédito
  const [boosted] = await prisma.$transaction([
    prisma.boostedEvent.create({
      data: {
        eventId,
        userId,
        stripeSessionId: `pro_credit_${Date.now()}`,
        boostType: 'pro',
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data:  { boostCredits: { decrement: 1 } },
    }),
  ]);

  return boosted;
}

// ─── Status de billing do usuário ────────────────────────────────────────────

async function getBillingStatus(userId) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      stripePlan:    true,
      planExpiresAt: true,
      boostCredits:  true,
    },
  });
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });

  // Boosts ativos do usuário
  const boostsAtivos = await prisma.boostedEvent.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { eventId: true, boostType: true, expiresAt: true },
  });

  return {
    plan:          user.stripePlan,
    planExpiresAt: user.planExpiresAt,
    boostCredits:  user.boostCredits,
    boostsAtivos,
    proBoostLimit: PRO_BOOST_LIMIT,
  };
}

// ─── Portal de gerenciamento ─────────────────────────────────────────────────

async function createBillingPortal({ userId, returnUrl }) {
  const customerId = await getOrCreateCustomer(userId);
  const session = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session) {
  // S3: Só processar se pagamento realmente confirmado
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    logger.warn('billing.webhook.skipped_unpaid', { sessionId: session.id, paymentStatus: session.payment_status });
    return;
  }

  const { userId, eventId, type } = session.metadata ?? {};

  if (type === 'boost_avulso' && userId && eventId) {
    const expiresAt = new Date(Date.now() + BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000);
    await prisma.boostedEvent.create({
      data: {
        eventId,
        userId,
        stripeSessionId: session.id,
        boostType: 'avulso',
        expiresAt,
      },
    });
    logger.info('billing.boost.avulso.activated', { userId, eventId, sessionId: session.id });
    return;
  }

  if (type === 'pro_subscription' && userId) {
    await prisma.user.update({
      where: { id: userId },
      data:  {
        stripePlan:   'pro',
        stripeSubId:  session.subscription ?? null,
        boostCredits: PRO_BOOST_LIMIT,
      },
    });
    logger.info('billing.pro.activated', { userId, sessionId: session.id });
  }
}

async function handleSubscriptionUpdated(subscription) {
  const { userId } = subscription.metadata ?? {};
  if (!userId) return;

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    const expiresAt = new Date(subscription.current_period_end * 1000);

    // Repõe créditos a cada renovação de ciclo
    await prisma.user.update({
      where: { id: userId },
      data:  {
        stripePlan:    'pro',
        planExpiresAt: expiresAt,
        boostCredits:  PRO_BOOST_LIMIT, // repõe 5 créditos todo ciclo
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription) {
  const { userId } = subscription.metadata ?? {};
  if (!userId) return;

  // Cancela boosts ativos do tipo 'pro' imediatamente
  await prisma.boostedEvent.updateMany({
    where:  { userId, boostType: 'pro', expiresAt: { gt: new Date() } },
    data:   { expiresAt: new Date() },
  });

  await prisma.user.update({
    where: { id: userId },
    data:  { stripePlan: 'free', stripeSubId: null, planExpiresAt: null, boostCredits: 0 },
  });
}

module.exports = {
  createBoostAvulsoCheckout,
  createProSubscriptionCheckout,
  boostEventWithCredit,
  getBillingStatus,
  createBillingPortal,
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
};
