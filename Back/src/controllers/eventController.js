const eventService = require('../services/eventService');
const socialProofService = require('../services/socialProofService');

async function getToday(req, res, next) {
  try {
    const events = await eventService.getTodayEvents(req.user?.id ?? null);
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const event = await eventService.createEvent({ ...req.body, authorId: req.user.id });
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await eventService.deleteEvent(req.params.id, req.user.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const event = await eventService.updateEvent(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
}

/**
 * POST /events/:id/checkin
 * Body (opcional): { lat: number, lng: number }
 */
async function checkin(req, res, next) {
  try {
    const { id } = req.params;
    const fingerprint = req.user?.id ?? req.ip;

    const alreadyIn = await socialProofService.hasCheckedIn(id, fingerprint);
    if (alreadyIn) {
      return res.json({ success: true, alreadyCheckedIn: true });
    }

    const event = await eventService.getEventById(id);

    let locationValidated = false;
    const { lat, lng } = req.body ?? {};
    if (lat != null && lng != null) {
      const eventLat = event.venue?.latitude ?? event.latitude;
      const eventLng = event.venue?.longitude ?? event.longitude;
      if (eventLat != null && eventLng != null) {
        locationValidated = haversineKm(lat, lng, eventLat, eventLng) <= 0.5;
      }
    }

    const result = await socialProofService.recordCheckin(id, fingerprint, locationValidated);
    const proof  = await socialProofService.getSocialProof(id, event.date.toISOString(), event.endDate?.toISOString() ?? null);

    res.json({ success: true, ...result, locationValidated, proof });
  } catch (err) { next(err); }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function recordView(req, res, next) {
  try {
    const { id } = req.params;
    const fingerprint = req.user?.id ?? req.ip;
    const event = await eventService.getEventById(id);
    await socialProofService.recordView(id, fingerprint);
    const proof = await socialProofService.getSocialProof(id, event.date.toISOString(), event.endDate?.toISOString() ?? null);
    res.json({ success: true, data: proof });
  } catch (err) { next(err); }
}

async function getSocialProof(req, res, next) {
  try {
    const { id } = req.params;
    const event = await eventService.getEventById(id);
    const proof = await socialProofService.getSocialProof(id, event.date.toISOString(), event.endDate?.toISOString() ?? null);
    res.json({ success: true, data: proof });
  } catch (err) { next(err); }
}

async function getSocialProofBatch(req, res, next) {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.slice(0, 50) : [];
    if (ids.length === 0) return res.json({ success: true, data: {} });

    const events = await Promise.all(
      ids.map(id => eventService.getEventById(id).catch(() => null))
    );

    const proofs = await Promise.all(
      events
        .filter(Boolean)
        .map(event => socialProofService.getSocialProof(
          event.id,
          event.date.toISOString(),
          event.endDate?.toISOString() ?? null,
        ).then(proof => [event.id, proof]))
    );

    const result = Object.fromEntries(proofs);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

module.exports = { getToday, getOne, create, update, remove, recordView, getSocialProof, getSocialProofBatch, checkin };
