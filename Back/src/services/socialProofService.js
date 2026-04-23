/**
 * Social Proof Service
 *
 * Persiste views e check-ins no PostgreSQL via Prisma.
 * Cache em memória (60s TTL) para evitar queries em todo polling.
 *
 * Estratégia:
 *   - recordView / recordCheckin → escrevem no DB imediatamente
 *   - getSocialProof → lê do cache; cache é invalidado por evento ao gravar
 *   - Limpeza automática de cache expirado a cada 5 min
 */

const prisma = require('../config/prisma');

// Cache: Map<eventId, { data: SocialProofData, expiresAt: number }>
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 60s

function invalidateCache(eventId) {
  cache.delete(eventId);
}

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of cache.entries()) {
    if (entry.expiresAt < now) cache.delete(id);
  }
}, 5 * 60 * 1000);

/** Registra visualização — persiste no DB e invalida cache. */
async function recordView(eventId, fingerprint) {
  try {
    await prisma.eventView.create({ data: { eventId, fingerprint } });
    invalidateCache(eventId);
  } catch {
    // Falha silenciosa — view não é crítica
  }
}

/**
 * Registra check-in — persiste no DB com unique constraint por fingerprint.
 * @returns {{ alreadyCheckedIn: boolean, checkinCount: number }}
 */
async function recordCheckin(eventId, fingerprint, locationValidated = false) {
  const weight = locationValidated ? 5 : 1;
  try {
    await prisma.checkin.create({
      data: { eventId, fingerprint, locationValidated, weight },
    });
    invalidateCache(eventId);
    const checkinCount = await prisma.checkin.count({ where: { eventId } });
    return { alreadyCheckedIn: false, checkinCount };
  } catch (e) {
    // P2002 = unique constraint (já fez check-in)
    if (e?.code === 'P2002') {
      const checkinCount = await prisma.checkin.count({ where: { eventId } });
      return { alreadyCheckedIn: true, checkinCount };
    }
    throw e;
  }
}

/** Verifica se fingerprint já fez check-in nesse evento. */
async function hasCheckedIn(eventId, fingerprint) {
  const row = await prisma.checkin.findUnique({
    where: { eventId_fingerprint: { eventId, fingerprint } },
    select: { id: true },
  });
  return !!row;
}

/**
 * Gera número base determinístico — garante que nunca mostra zero,
 * mas varia suavemente ao longo do tempo sem flutuar por request.
 */
function deterministicBase(eventId, windowMinutes = 10, min = 8, max = 60) {
  const hash = eventId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const timeSlot = Math.floor(Date.now() / (windowMinutes * 60 * 1000));
  const seed = (hash * 2654435761 + timeSlot * 40503) >>> 0;
  return min + (seed % (max - min));
}

/**
 * Retorna payload de prova social para um evento.
 * Usa cache de 60s; se expirado, consulta o DB.
 */
async function getSocialProof(eventId, startDateIso, endDateIso) {
  const cached = cache.get(eventId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const now = Date.now();
  const start = new Date(startDateIso).getTime();
  const end = endDateIso
    ? new Date(endDateIso).getTime()
    : start + 3 * 60 * 60 * 1000;

  const cutoff2h  = new Date(now - 2 * 60 * 60 * 1000);
  const cutoff1h  = new Date(now - 60 * 60 * 1000);
  const cutoff30m = new Date(now - 30 * 60 * 1000);

  // Queries paralelas para minimizar latência
  const [views2h, views1h, views30m, checkins, checkins1h] = await Promise.all([
    prisma.eventView.count({ where: { eventId, createdAt: { gte: cutoff2h } } }),
    prisma.eventView.count({ where: { eventId, createdAt: { gte: cutoff1h } } }),
    prisma.eventView.count({ where: { eventId, createdAt: { gte: cutoff30m } } }),
    prisma.checkin.findMany({ where: { eventId }, select: { weight: true, createdAt: true } }),
    prisma.checkin.count({ where: { eventId, createdAt: { gte: cutoff1h } } }),
  ]);

  const totalCheckins = checkins.length;
  const checkinWeight = checkins.reduce((s, c) => s + (c.weight ?? 1), 0);
  const totalViews    = await prisma.eventView.count({ where: { eventId } });

  const isLive     = now >= start && now < end;
  const isUpcoming = now < start && (start - now) < 60 * 60 * 1000;
  const isPast     = now >= end;

  let base;
  if (isPast)          base = deterministicBase(eventId, 30, 2, 10);
  else if (isLive)     base = deterministicBase(eventId, 10, 20, 80);
  else if (isUpcoming) base = deterministicBase(eventId, 10, 10, 40);
  else                 base = deterministicBase(eventId, 30, 3, 18);

  const realContrib  = views1h * 4 + checkinWeight * 8;
  const pessoasAgora = Math.max(base, base + realContrib);

  const chegaram = Math.max(
    0,
    views30m * 3 + checkins1h * 6 + deterministicBase(eventId + '_arr', 15, 0, 12),
  );

  const totalBase    = deterministicBase(eventId + '_views', 60, 40, 300);
  const visualizacoes = totalBase + totalViews * 2 + totalCheckins * 3;

  let textoAgora;
  if (pessoasAgora < 5)       textoAgora = 'Algumas pessoas agora';
  else if (pessoasAgora < 50) textoAgora = `${pessoasAgora} pessoas agora`;
  else                        textoAgora = `+${Math.floor(pessoasAgora / 10) * 10} pessoas`;

  const textoChegaram = (!isPast && chegaram >= 3)
    ? `+${chegaram} chegaram na última hora`
    : null;

  const data = {
    pessoasAgora,
    textoAgora,
    textoChegaram,
    visualizacoes,
    totalCheckins,
    isLive,
    isUpcoming,
  };

  cache.set(eventId, { data, expiresAt: Date.now() + CACHE_TTL });
  return data;
}

module.exports = { recordView, recordCheckin, hasCheckedIn, getSocialProof };
