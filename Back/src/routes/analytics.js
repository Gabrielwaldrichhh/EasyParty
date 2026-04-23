const { Router } = require('express');
const authMiddleware = require('../middlewares/auth');
const analyticsService = require('../services/analyticsService');

const router = Router();

router.use(authMiddleware);

/** GET /analytics/dashboard — dashboard completo do organizador */
router.get('/dashboard', async (req, res, next) => {
  try {
    const data = await analyticsService.getDashboard(req.user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;
