const express = require('express');
const { rateLimit } = require('express-rate-limit');
const auth = require('../middleware/auth');
const {
  signup,
  login,
  getCurrentUser,
} = require('../controllers/authController');

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Try again later.' },
});

router.post('/signup', authRateLimit, signup);
router.post('/login', authRateLimit, login);
router.get('/me', auth, getCurrentUser);

module.exports = router;
