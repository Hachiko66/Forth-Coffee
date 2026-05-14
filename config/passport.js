const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./db');

module.exports = (passport) => {
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
      if (!rows[0]) return done(null, false, { message: 'Email tidak ditemukan' });
      const user = rows[0];
      if (!user.password_hash) return done(null, false, { message: 'Akun ini terdaftar via Google' });
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return done(null, false, { message: 'Password salah' });
      return done(null, user);
    } catch(e) { return done(e); }
  }));

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://forth.coffee/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const avatar = profile.photos[0]?.value;
      const googleId = profile.id;
      let { rows } = await db.query('SELECT * FROM users WHERE google_id=$1 OR email=$2', [googleId, email]);
      let user = rows[0];
      if (!user) {
        const res = await db.query(
          'INSERT INTO users (email,name,google_id,avatar_url,provider,is_verified) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
          [email, name, googleId, avatar, 'google', true]
        );
        user = res.rows[0];
      } else if (!user.google_id) {
        await db.query('UPDATE users SET google_id=$1, avatar_url=$2, is_verified=true WHERE id=$3', [googleId, avatar, user.id]);
        user.google_id = googleId;
      }
      return done(null, user);
    } catch(e) { return done(e); }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const { rows } = await db.query('SELECT id,email,name,phone,address,city,avatar_url,provider FROM users WHERE id=$1', [id]);
      done(null, rows[0]);
    } catch(e) { done(e); }
  });
};
