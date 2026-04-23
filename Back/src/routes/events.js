const { Router } = require('express');
const { z } = require('zod');
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middlewares/auth');
const authOptional = require('../middlewares/authOptional');
const validate = require('../middlewares/validate');

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  category: z.enum(['PARTY','SHOW','SPORTS','ESPORTS','FESTIVAL','THEATER','WORKSHOP','GASTRONOMY','NETWORKING','RELIGIOUS','OTHER']).default('PARTY'),
  customCategory: z.string().max(50).optional(),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  price: z.number().min(0).default(0),
  maxCapacity: z.number().int().positive().optional(),
  minAge: z.number().int().min(0).max(21).optional(),
  imageUrl: z.string().url().optional(),
  isPublic: z.boolean().default(true),
  venueId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().optional(),
}).refine(d => d.venueId || (d.latitude != null && d.longitude != null), {
  message: 'Either venueId or latitude/longitude is required',
}).refine(d => {
  if (!d.endDate) return true;
  const duration = new Date(d.endDate).getTime() - new Date(d.date).getTime();
  return duration > 0 && duration <= 36 * 60 * 60 * 1000;
}, { message: 'O evento deve terminar após o início e ter duração máxima de 36 horas' });

const updateEventSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(['PARTY','SHOW','SPORTS','ESPORTS','FESTIVAL','THEATER','WORKSHOP','GASTRONOMY','NETWORKING','RELIGIOUS','OTHER']).optional(),
  customCategory: z.string().max(50).optional(),
  date: z.string().datetime().optional(),
  endDate: z.string().datetime().nullable().optional(),
  price: z.number().min(0).optional(),
  maxCapacity: z.number().int().positive().optional(),
  minAge: z.number().int().min(0).max(21).optional().nullable(),
  address: z.string().optional(),
  isPublic: z.boolean().optional(),
});

router.get('/',  authOptional, eventController.getToday);
router.post('/social-proof/batch', authOptional, eventController.getSocialProofBatch);
router.get('/:id', eventController.getOne);
router.get('/:id/social-proof', authOptional, eventController.getSocialProof);
router.post('/:id/view',        authOptional, eventController.recordView);
router.post('/:id/checkin',     authOptional, eventController.checkin);
router.post('/', authMiddleware, validate(createEventSchema), eventController.create);
router.put('/:id', authMiddleware, validate(updateEventSchema), eventController.update);
router.delete('/:id', authMiddleware, eventController.remove);

module.exports = router;
