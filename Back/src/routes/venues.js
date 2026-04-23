const { Router } = require('express');
const { z } = require('zod');
const venueController = require('../controllers/venueController');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = Router();

const createVenueSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  type: z.enum(['NIGHTCLUB', 'BAR', 'RESTAURANT', 'EVENT_SPACE', 'OUTDOOR', 'PRIVATE', 'OTHER']).default('OTHER'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const updateVenueSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(['NIGHTCLUB', 'BAR', 'RESTAURANT', 'EVENT_SPACE', 'OUTDOOR', 'PRIVATE', 'OTHER']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

router.get('/', venueController.getAll);
router.get('/:id', venueController.getOne);
router.post('/', authMiddleware, validate(createVenueSchema), venueController.create);
router.put('/:id', authMiddleware, validate(updateVenueSchema), venueController.update);
router.delete('/:id', authMiddleware, venueController.remove);

module.exports = router;
