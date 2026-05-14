const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'forth-jwt-secret-2025';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ','');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch(e) { res.status(401).json({ error: 'Token invalid' }); }
};

router.put('/profile', auth, async (req, res) => {
  const { name, phone, address, city } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE users SET name=$1,phone=$2,address=$3,city=$4,updated_at=NOW() WHERE id=$5 RETURNING id,name,email,phone,address,city,avatar_url',
      [name, phone, address, city, req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch(e) { res.status(500).json({ error: 'Update gagal' }); }
});

module.exports = router;
