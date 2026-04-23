require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const eventRoutes     = require('./routes/events');
const venueRoutes     = require('./routes/venues');
const billingRoutes   = require('./routes/billing');
const uploadRoutes    = require('./routes/upload');
const analyticsRoutes = require('./routes/analytics');
const errorHandler    = require('./middlewares/errorHandler');

const app = express();

// Necessário para rate limiting e logs de IP corretos atrás de proxies (Railway, Heroku, etc.)
app.set('trust proxy', 1);

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'", 'https:'],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // evita quebrar Leaflet tiles
}));
const allowedOrigin = process.env.NODE_ENV === 'production'
  ? process.env.FRONTEND_URL
  : 'http://localhost:5173';

if (process.env.NODE_ENV === 'production' && !allowedOrigin) {
  console.error('FATAL: FRONTEND_URL não definida em produção — CORS bloqueará todas as origens');
  process.exit(1);
}

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,           // geral — aumentado para suportar polling de múltiplos eventos
  standardHeaders: true,
  legacyHeaders: false,
});
// Rotas de leitura de métricas — permissivas para polling, mas com limite razoável
const metricsLimiter = rateLimit({
  windowMs: 60 * 1000, // janela de 1 min
  max: 60,             // 60 req/min por IP (1 req/s — suficiente para polling normal)
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, try again later' },
});

// Rotas de escrita (create/update/delete de eventos)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many write requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Webhook do Stripe precisa do raw body — registrar ANTES do express.json
app.use('/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' }));

// Routes
// Rate limit dedicado para upload: 20 uploads por IP a cada 15 min
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Limite de uploads atingido. Tente novamente em breve.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth',    authLimiter, authRoutes);
app.use('/events/:id/social-proof', metricsLimiter);
app.use('/events/:id/view',         metricsLimiter);
app.use('/events',  writeLimiter, eventRoutes);
app.use('/venues',  venueRoutes);
app.use('/billing', billingRoutes);
app.use('/upload',    uploadLimiter, uploadRoutes);
app.use('/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
