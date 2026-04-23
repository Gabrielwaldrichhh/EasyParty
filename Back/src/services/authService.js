const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

async function register({ username, email, password }) {
  // Trim para evitar espaços acidentais; email normalizado para lowercase
  username = username.trim();
  email    = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
    select: { id: true, username: true, email: true, createdAt: true },
  });

  const token = generateToken(user);
  return { user, token };
}

async function login({ username, password }) {
  username = username.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
    },
  });

  if (!user) {
    const err = new Error('Usuário ou senha inválidos');
    err.status = 401;
    throw err;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    const err = new Error('Usuário ou senha inválidos');
    err.status = 401;
    throw err;
  }

  const { password: _, ...userWithoutPassword } = user;
  const token = generateToken(userWithoutPassword);
  return { user: userWithoutPassword, token };
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function isUsernameAvailable(username) {
  const user = await prisma.user.findUnique({ where: { username } });
  return !user;
}

async function isEmailAvailable(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  return !user;
}

async function suggestUsernames(username) {
  const base = username.replace(/[^a-zA-Z0-9_]/g, '');
  const candidates = [
    `${base}${Math.floor(Math.random() * 90 + 10)}`,
    `${base}${Math.floor(Math.random() * 900 + 100)}`,
    `${base}_${Math.floor(Math.random() * 90 + 10)}`,
  ];
  const results = await Promise.all(
    candidates.map(async c => {
      const exists = await prisma.user.findUnique({ where: { username: c } });
      return exists ? null : c;
    })
  );
  return results.filter(Boolean).slice(0, 3);
}

const USER_PUBLIC_SELECT = {
  id: true, username: true, email: true, avatarUrl: true,
  displayName: true, bio: true, phone: true, city: true, state: true, birthDate: true,
  createdAt: true,
};

async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_PUBLIC_SELECT });
  if (!user) { const err = new Error('Usuário não encontrado'); err.status = 404; throw err; }
  return user;
}

async function updateProfile(id, data) {
  const trim = (v) => (typeof v === 'string' ? v.trim() : v);
  const updateData = {};
  if (data.displayName !== undefined) updateData.displayName = trim(data.displayName) || null;
  if (data.bio         !== undefined) updateData.bio         = trim(data.bio) || null;
  if (data.phone       !== undefined) updateData.phone       = trim(data.phone) || null;
  if (data.city        !== undefined) updateData.city        = trim(data.city) || null;
  if (data.state       !== undefined) updateData.state       = trim(data.state) || null;
  if (data.avatarUrl   !== undefined) updateData.avatarUrl   = data.avatarUrl || null;
  if (data.birthDate   !== undefined) updateData.birthDate   = data.birthDate ? new Date(data.birthDate) : null;

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: USER_PUBLIC_SELECT,
  });
}

module.exports = { register, login, isUsernameAvailable, isEmailAvailable, suggestUsernames, getUserById, updateProfile };
