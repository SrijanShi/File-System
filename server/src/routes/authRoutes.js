const express = require('express');
const router = express.Router();
const { signup, login, logout, me } = require('../controllers/authController');
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const { protect } = require('../middleware/auth');

// Standard auth
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

// OTP email verification (signup flow)
router.post('/otp/send',   sendOtp);
router.post('/otp/verify', verifyOtp);

module.exports = router;
