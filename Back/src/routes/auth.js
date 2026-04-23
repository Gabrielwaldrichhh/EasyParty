const { Router } = require('express');
const { z } = require('zod');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e _'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial'),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Informe o usuário ou e-mail'),
  password: z.string().min(1, 'Informe a senha'),
});

const updateProfileSchema = z.object({
  displayName: z.string().max(60).optional(),
  bio:         z.string().max(300).optional(),
  phone:       z.string().max(20).optional(),
  city:        z.string().max(60).optional(),
  state:       z.string().max(40).optional(),
  birthDate:   z.string().datetime().optional().nullable(),
  avatarUrl:   z.string().url().optional().nullable(),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/check/username/:username', authController.checkUsername);
router.get('/check/email/:email', authController.checkEmail);
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
