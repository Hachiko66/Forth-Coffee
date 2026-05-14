const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'forth-jwt-secret-2025';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ','');
  if (!token) return res.status(401).json({ error: 'Login diperlukan' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch(e) { res.status(401).json({ error: 'Token tidak valid' }); }
};

const genCode = () => 'FC' + Date.now().toString(36).toUpperCase();

// Create order
router.post('/', auth, async (req, res) => {
  const { items, subtotal, total, payment_method, shipping_name, shipping_phone, shipping_address, shipping_city, notes } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'Pesanan kosong' });
  try {
    const { rows } = await db.query(
      `INSERT INTO orders (user_id,order_code,items,subtotal,total,payment_method,shipping_name,shipping_phone,shipping_address,shipping_city,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.id, genCode(), JSON.stringify(items), subtotal, total, payment_method, shipping_name, shipping_phone, shipping_address, shipping_city, notes]
    );
    res.json({ success: true, order: rows[0] });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Gagal membuat order' }); }
});

// Order history
router.get('/my', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ orders: rows });
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
