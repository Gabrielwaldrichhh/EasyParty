const { Router }     = require('express');
const billingController = require('../controllers/billingController');
const authMiddleware    = require('../middlewares/auth');

const router = Router();

// Webhook — raw body já configurado no server.js ANTES do express.json
router.post('/webhook', billingController.webhook);

// Rotas autenticadas
router.get ('/status',        authMiddleware, billingController.billingStatus);
router.post('/checkout-boost',authMiddleware, billingController.checkoutBoostAvulso);
router.post('/checkout-pro',  authMiddleware, billingController.checkoutPro);
router.post('/boost-pro',     authMiddleware, billingController.boostComCredito);
router.post('/portal',        authMiddleware, billingController.billingPortal);

module.exports = router;
