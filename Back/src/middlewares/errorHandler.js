const isProd = process.env.NODE_ENV === 'production';

function errorHandler(err, req, res, next) {
  // Em produção, evitar vazar detalhes internos nos logs visíveis ao cliente
  if (isProd) {
    console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  } else {
    console.error(err);
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err.code === 'P2002') {
    if (!isProd) console.log('P2002 meta:', JSON.stringify(err.meta));
    const target = err.meta?.target;
    const field = Array.isArray(target) ? target[0] : (typeof target === 'string' ? target : 'campo');
    const labels = { username: 'Nome de usuário', email: 'E-mail' };
    const label = labels[field] || 'Campo';
    return res.status(409).json({ success: false, message: `${label} já está em uso` });
  }

  const status = err.status || 500;

  // Em produção: nunca expor mensagem interna de erros 500
  const message = (status < 500 || !isProd)
    ? (err.message || 'Erro interno do servidor')
    : 'Erro interno do servidor';

  const body = { success: false, message };
  if (err.code && status < 500) body.code = err.code;

  res.status(status).json(body);
}

module.exports = errorHandler;
