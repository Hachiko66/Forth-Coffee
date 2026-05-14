const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'forth-jwt-secret-2025';
const makeToken = (user) => jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Semua field wajib diisi' });
  if (password.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter' });
  try {
    const exist = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exist.rows[0]) return res.status(409).json({ error: 'Email sudah terdaftar' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      'INSERT INTO users (name,email,password_hash,phone,provider,is_verified) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,email,phone',
      [name, email, hash, phone||null, 'email', true]
    );
    const user = rows[0];
    res.json({ success: true, token: makeToken(user), user: { id:user.id, name:user.name, email:user.email } });
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Login gagal' });
    res.json({ success: true, token: makeToken(user), user: { id:user.id, name:user.name, email:user.email, avatar_url:user.avatar_url } });
  })(req, res, next);
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/?auth=error' }),
  (req, res) => {
    const token = makeToken(req.user);
    res.redirect(`/?auth=success&token=${token}&name=${encodeURIComponent(req.user.name)}`);
  }
);

// Verify token
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.replace('Bearer ',''), JWT_SECRET);
    const { rows } = await db.query('SELECT id,name,email,phone,address,city,avatar_url,provider FROM users WHERE id=$1', [decoded.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch(e) { res.status(401).json({ error: 'Token invalid' }); }
});

// Logout
router.post('/logout', (req, res) => { req.logout(()=>{}); res.json({ success: true }); });

module.exports = router;
