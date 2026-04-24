const rateLimit = require('express-rate-limit');

// Rate limit por userId quando autenticado, IP como fallback
function rateLimitByUser(options) {
  return rateLimit({
    ...options,
    keyGenerator: (req) => req.user?.id ?? req.ip,
  });
}

module.exports = rateLimitByUser;
