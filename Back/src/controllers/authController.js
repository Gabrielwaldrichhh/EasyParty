const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function checkUsername(req, res, next) {
  try {
    const { username } = req.params;
    const available = await authService.isUsernameAvailable(username);
    const suggestions = available ? [] : await authService.suggestUsernames(username);
    res.json({ available, suggestions });
  } catch (err) {
    next(err);
  }
}

async function checkEmail(req, res, next) {
  try {
    const { email } = req.params;
    const available = await authService.isEmailAvailable(email);
    res.json({ available });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

module.exports = { register, login, checkUsername, checkEmail, getMe, updateProfile };
