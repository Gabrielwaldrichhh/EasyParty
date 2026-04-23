const prisma = require('../config/prisma');

const eventInclude = {
  author: { select: { id: true, username: true, avatarUrl: true } },
  venue: { select: { id: true, name: true, type: true, latitude: true, longitude: true, address: true } },
};

// Retorna eventos ativos: ainda não terminaram (ou sem endDate, usa date + 1 dia como fim)
// Se userId informado, inclui também os eventos privados do próprio usuário
async function getTodayEvents(userId = null) {
  const now = new Date();

  const activeWindow = {
    OR: [
      // Tem endDate definido e ainda não terminou
      { endDate: { not: null, gte: now } },
      // Sem endDate: considera ativo enquanto não passou 1 dia após início
      { endDate: null, date: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    ],
  };

  const visibilityFilter = userId
    ? { OR: [{ isPublic: true }, { isPublic: false, authorId: userId }] }
    : { isPublic: true };

  return prisma.event.findMany({
    where: { AND: [activeWindow, visibilityFilter] },
    include: eventInclude,
    orderBy: { date: 'asc' },
  });
}

async function getEventById(id) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: eventInclude,
  });
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }
  return event;
}

async function createEvent({ title, description, category, customCategory, date, endDate, price, maxCapacity, minAge, imageUrl, isPublic, venueId, latitude, longitude, address, authorId }) {
  return prisma.event.create({
    data: {
      title: title.trim(),
      description: description?.trim(),
      category: category || 'PARTY',
      customCategory: category === 'OTHER' ? (customCategory || null) : null,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      price: price || 0,
      maxCapacity,
      minAge: minAge ?? null,
      imageUrl,
      isPublic: isPublic !== false,
      authorId,
      venueId: venueId || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      address: address || null,
    },
    include: eventInclude,
  });
}

async function deleteEvent(id, userId) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }
  if (event.authorId !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  await prisma.event.delete({ where: { id } });
}

async function updateEvent(id, userId, data) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) { const err = new Error('Evento não encontrado'); err.status = 404; throw err; }
  if (event.authorId !== userId) { const err = new Error('Sem permissão'); err.status = 403; throw err; }
  return prisma.event.update({
    where: { id },
    data: {
      ...(data.title       !== undefined && { title: data.title.trim() }),
      ...(data.description    !== undefined && { description: data.description?.trim() }),
      ...(data.category       !== undefined && { category: data.category }),
      ...(data.customCategory !== undefined && { customCategory: data.category === 'OTHER' ? data.customCategory : null }),
      ...(data.minAge !== undefined && { minAge: data.minAge ?? null }),
      ...(data.date        !== undefined && { date: new Date(data.date) }),
      ...(data.endDate     !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.price       !== undefined && { price: data.price }),
      ...(data.maxCapacity !== undefined && { maxCapacity: data.maxCapacity }),
      ...(data.address     !== undefined && { address: data.address }),
      ...(data.isPublic    !== undefined && { isPublic: data.isPublic }),
    },
    include: eventInclude,
  });
}

module.exports = { getTodayEvents, getEventById, createEvent, updateEvent, deleteEvent };
