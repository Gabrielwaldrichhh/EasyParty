const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

// Pastas por contexto
const FOLDER_MAP = {
  avatar: 'easyparty/avatars',
  event:  'easyparty/events',
  venue:  'easyparty/venues',
};

function makeUploader(context) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: FOLDER_MAP[context] ?? 'easyparty/misc',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: buildTransformation(context),
      // public_id gerado automaticamente pelo Cloudinary (UUID)
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(new Error('Formato não suportado. Use JPEG, PNG, WebP ou GIF.'));
      }
      cb(null, true);
    },
  });
}

function buildTransformation(context) {
  // Cloudinary redimensiona e converte para WebP no servidor
  switch (context) {
    case 'avatar':
      return [{ width: 400, height: 400, crop: 'fill', gravity: 'face', format: 'webp', quality: 'auto:good' }];
    case 'event':
      return [{ width: 1280, height: 720, crop: 'fill', gravity: 'auto', format: 'webp', quality: 'auto:good' }];
    case 'venue':
      return [{ width: 1280, height: 720, crop: 'fill', gravity: 'auto', format: 'webp', quality: 'auto:good' }];
    default:
      return [{ width: 1280, format: 'webp', quality: 'auto:good' }];
  }
}

// Middleware de erro do multer → resposta padronizada
function handleUploadError(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'Arquivo muito grande. Máximo 8 MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
}

module.exports = { makeUploader, handleUploadError };
