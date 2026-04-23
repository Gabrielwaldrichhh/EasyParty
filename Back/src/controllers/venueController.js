const venueService = require('../services/venueService');

async function getAll(req, res, next) {
  try {
    const venues = await venueService.getAllVenues();
    res.json({ success: true, data: venues });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const venue = await venueService.getVenueById(req.params.id);
    res.json({ success: true, data: venue });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const venue = await venueService.createVenue({ ...req.body, ownerId: req.user.id });
    res.status(201).json({ success: true, data: venue });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await venueService.deleteVenue(req.params.id, req.user.id);
    res.json({ success: true, message: 'Venue deleted' });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const venue = await venueService.updateVenue(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: venue });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };
