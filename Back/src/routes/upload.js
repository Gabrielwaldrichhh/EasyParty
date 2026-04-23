const { Router } = require('express');
const authMiddleware = require('../middlewares/auth');
const { makeUploader, handleUploadError } = require('../middlewares/upload');

const router = Router();

// Todos os uploads exigem autenticação
router.use(authMiddleware);

/**
 * POST /upload/avatar
 * Faz upload da foto de perfil do usuário autenticado.
 * Retorna { url } pronta para salvar em User.avatarUrl via PUT /auth/profile
 */
router.post('/avatar', (req, res, next) => {
  const uploader = makeUploader('avatar');
  uploader.single('image')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    if (!req.file) return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada.' });
    res.json({ success: true, url: req.file.path });
  });
});

/**
 * POST /upload/event
 * Upload de capa de evento.
 */
router.post('/event', (req, res, next) => {
  const uploader = makeUploader('event');
  uploader.single('image')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    if (!req.file) return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada.' });
    res.json({ success: true, url: req.file.path });
  });
});

/**
 * POST /upload/venue
 * Upload de foto de venue.
 */
router.post('/venue', (req, res, next) => {
  const uploader = makeUploader('venue');
  uploader.single('image')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    if (!req.file) return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada.' });
    res.json({ success: true, url: req.file.path });
  });
});

module.exports = router;
