const prisma = require('../config/prisma');
const socialProofService = require('./socialProofService');

/**
 * Agrega todos os dados do dashboard para um organizador.
 * Combina dados persistidos no banco (eventos, boosts, plano)
 * com dados em memória do socialProofService (views, check-ins em tempo real).
 */
async function getDashboard(userId) {
  const now = new Date();
  const ontem = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const semanaPassada = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── Busca eventos do organizador ─────────────────────────────────────────
  const todosEventos = await prisma.event.findMany({
    where: { authorId: userId },
    include: {
      venue: { select: { id: true, name: true } },
      boostedBy: { where: { expiresAt: { gte: now } } },
    },
    orderBy: { date: 'desc' },
  });

  // ── Busca status de billing ───────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripePlan: true, boostCredits: true, planExpiresAt: true, stripeSubId: true },
  });

  // ── Separa eventos ativos/encerrados ─────────────────────────────────────
  const ativos = todosEventos.filter(e => {
    const fim = e.endDate ?? new Date(e.date.getTime() + 24 * 60 * 60 * 1000);
    return fim >= now;
  });
  const encerrados = todosEventos.filter(e => {
    const fim = e.endDate ?? new Date(e.date.getTime() + 24 * 60 * 60 * 1000);
    return fim < now;
  });
  const emAndamento = ativos.filter(e => e.date <= now);
  const futuros = ativos.filter(e => e.date > now);

  // ── Boosts ativos ─────────────────────────────────────────────────────────
  const boostsAtivos = await prisma.boostedEvent.findMany({
    where: { userId, expiresAt: { gte: now } },
    include: { event: { select: { id: true, title: true, category: true } } },
  });

  // Histórico de boosts para calcular ROI
  const todosBoosts = await prisma.boostedEvent.findMany({
    where: { userId },
    orderBy: { paidAt: 'desc' },
    take: 50,
  });

  // ── Social proof em memória ───────────────────────────────────────────────
  // Coleta métricas em tempo real de todos os eventos ativos
  const metricas = [];
  let totalViewsGlobal = 0;
  let totalCheckinsGlobal = 0;

  for (const evento of todosEventos) {
    const proof = await socialProofService.getSocialProof(
      evento.id,
      evento.date.toISOString(),
      evento.endDate?.toISOString() ?? null,
    );

    const hypeScore = calcHypeScore(proof, evento.date, evento.endDate);
    const isBoosted = evento.boostedBy.length > 0;
    const fim = evento.endDate ?? new Date(evento.date.getTime() + 24 * 60 * 60 * 1000);
    const isAtivo = fim >= now;

    totalViewsGlobal    += proof.visualizacoes;
    totalCheckinsGlobal += proof.totalCheckins;

    metricas.push({
      eventId:     evento.id,
      title:       evento.title,
      category:    evento.category,
      date:        evento.date,
      endDate:     evento.endDate,
      isAtivo,
      isBoosted,
      views:       proof.visualizacoes,
      checkins:    proof.totalCheckins,
      pessoasAgora: proof.pessoasAgora,
      hypeScore,
      venue:       evento.venue?.name ?? null,
      imageUrl:    evento.imageUrl,
      price:       evento.price,
    });
  }

  // ── Cálculo de ROI ────────────────────────────────────────────────────────
  const gastoBoosts = todosBoosts.reduce((acc, b) => {
    return acc + (b.boostType === 'avulso' ? 9.99 : 0);
  }, 0);

  const gastoAssinatura = user?.stripeSubId ? (
    // Conta quantos meses o plano está ativo (estimativa: desde planExpiresAt - 30 dias)
    user.planExpiresAt
      ? Math.max(1, Math.ceil((now - new Date(user.planExpiresAt.getTime() - 30 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000))) * 29.99
      : 29.99
  ) : 0;

  const totalInvestido = gastoBoosts + gastoAssinatura;

  // Estimativa de pessoas geradas por eventos com boost
  const pessoasBoost = metricas
    .filter(m => m.isBoosted)
    .reduce((s, m) => s + m.checkins * 3 + m.pessoasAgora, 0);

  // ROI simplificado: se o evento tem preço, estima receita por checkin
  const receitaEstimada = metricas.reduce((s, m) => {
    const evento = todosEventos.find(e => e.id === m.eventId);
    if (!evento || evento.price === 0) return s;
    return s + m.checkins * evento.price * 0.5; // assume 50% conversão
  }, 0);

  const roiPercent = totalInvestido > 0
    ? Math.round(((receitaEstimada - totalInvestido) / totalInvestido) * 100)
    : null;

  // ── Top eventos por hype ──────────────────────────────────────────────────
  const topEventos = [...metricas]
    .filter(m => m.isAtivo)
    .sort((a, b) => b.hypeScore - a.hypeScore)
    .slice(0, 5);

  // ── Série temporal fake (últimos 7 dias com base nos dados atuais) ────────
  // Como o social proof é in-memory, simulamos uma curva plausível
  const serieViews = gerarSerie(totalViewsGlobal, 7);
  const serieCheckins = gerarSerie(totalCheckinsGlobal, 7);

  return {
    overview: {
      totalEventos:    todosEventos.length,
      eventosAtivos:   ativos.length,
      emAndamento:     emAndamento.length,
      futuros:         futuros.length,
      encerrados:      encerrados.length,
      totalViews:      totalViewsGlobal,
      totalCheckins:   totalCheckinsGlobal,
      boostsAtivos:    boostsAtivos.length,
      boostCredits:    user?.boostCredits ?? 0,
      plan:            user?.stripePlan ?? 'free',
      planExpiresAt:   user?.planExpiresAt ?? null,
    },
    roi: {
      totalInvestido:   Math.round(totalInvestido * 100) / 100,
      receitaEstimada:  Math.round(receitaEstimada * 100) / 100,
      roiPercent,
      pessoasGeradas:  pessoasBoost,
      gastoBoosts:     Math.round(gastoBoosts * 100) / 100,
      gastoAssinatura: Math.round(gastoAssinatura * 100) / 100,
    },
    metricas,
    topEventos,
    boostsAtivos: boostsAtivos.map(b => ({
      eventId:   b.eventId,
      title:     b.event.title,
      category:  b.event.category,
      boostType: b.boostType,
      expiresAt: b.expiresAt,
      paidAt:    b.paidAt,
    })),
    historico: {
      serieViews,
      serieCheckins,
      labels: gerarLabels(7),
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcHypeScore(proof, dateStr, endDateStr) {
  const now = Date.now();
  const start = new Date(dateStr).getTime();
  const end = endDateStr ? new Date(endDateStr).getTime() : start + 3 * 60 * 60 * 1000;
  const isLive = start <= now && now <= end;
  const isSoon = !isLive && start - now <= 2 * 60 * 60 * 1000 && start > now;

  let score = 0;
  if (isLive)       score += 30;
  else if (isSoon)  score += 20;
  else if (start > now) score += 10;

  score += Math.min(25, Math.floor(proof.pessoasAgora / 2));
  score += Math.min(20, Math.floor(proof.visualizacoes / 10));
  score += Math.min(15, proof.totalCheckins * 3);

  return Math.min(100, score);
}

function gerarSerie(total, dias) {
  // Distribui o total de forma crescente nos últimos N dias (curva realista)
  const pesos = Array.from({ length: dias }, (_, i) => Math.pow(1.3, i));
  const soma = pesos.reduce((a, b) => a + b, 0);
  return pesos.map(p => Math.round((p / soma) * total));
}

function gerarLabels(dias) {
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (dias - 1 - i));
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
  });
}

module.exports = { getDashboard };
