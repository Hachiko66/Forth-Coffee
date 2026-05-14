require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors({ origin: process.env.CLIENT_URL || 'https://forth.coffee', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'forth-coffee-secret-2025',
  resave: false, saveUninitialized: false,
  cookie: { secure: false, maxAge: 24*60*60*1000 }
}));
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/user', require('./routes/user'));
app.get('/api/health', (req,res) => res.json({status:'ok', service:'forth-coffee-api'}));

app.listen(PORT, () => console.log(`Forth Coffee API running on port ${PORT}`));
