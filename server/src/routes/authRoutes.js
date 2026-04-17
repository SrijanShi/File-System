const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { signup, login, logout, me } = require('../controllers/authController');
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const { protect } = require('../middleware/auth');
const { signToken } = require('../utils/jwtHelper');

// Standard auth
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

// OTP email verification
router.post('/otp/send',   sendOtp);
router.post('/otp/verify', verifyOtp);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth?error=oauth` }),
  (req, res) => {
    const token = signToken(req.user._id, req.user.email);
    // Redirect to frontend with token in query string; frontend stores it and redirects to /drive
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;
