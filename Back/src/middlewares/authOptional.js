const jwt = require('jsonwebtoken');

function authOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch {
      // token inválido — ignora, continua sem usuário
    }
  }
  next();
}

module.exports = authOptional;
