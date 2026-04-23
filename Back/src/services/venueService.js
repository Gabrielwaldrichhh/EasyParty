const prisma = require('../config/prisma');

const venueInclude = {
  owner: { select: { id: true, username: true, avatarUrl: true } },
  events: {
    where: (() => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end   = new Date(); end.setHours(23, 59, 59, 999);
      return { date: { gte: start, lte: end }, isPublic: true };
    })(),
    orderBy: { date: 'asc' },
  },
};

async function getAllVenues() {
  return prisma.venue.findMany({
    include: venueInclude,
    orderBy: { name: 'asc' },
  });
}

async function getVenueById(id) {
  const venue = await prisma.venue.findUnique({ where: { id }, include: venueInclude });
  if (!venue) {
    const err = new Error('Venue not found');
    err.status = 404;
    throw err;
  }
  return venue;
}

async function createVenue({ name, description, type, latitude, longitude, address, city, state, imageUrl, ownerId }) {
  return prisma.venue.create({
    data: { name, description, type: type || 'OTHER', latitude, longitude, address, city, state, imageUrl, ownerId },
    include: venueInclude,
  });
}

async function deleteVenue(id, userId) {
  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) {
    const err = new Error('Venue not found');
    err.status = 404;
    throw err;
  }
  if (venue.ownerId !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  await prisma.venue.delete({ where: { id } });
}

async function updateVenue(id, userId, data) {
  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) { const err = new Error('Local não encontrado'); err.status = 404; throw err; }
  if (venue.ownerId !== userId) { const err = new Error('Sem permissão'); err.status = 403; throw err; }
  return prisma.venue.update({
    where: { id },
    data: {
      ...(data.name        !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type        !== undefined && { type: data.type }),
      ...(data.address     !== undefined && { address: data.address }),
      ...(data.city        !== undefined && { city: data.city }),
      ...(data.state       !== undefined && { state: data.state }),
    },
    include: venueInclude,
  });
}

module.exports = { getAllVenues, getVenueById, createVenue, updateVenue, deleteVenue };
