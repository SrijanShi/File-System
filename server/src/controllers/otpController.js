const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');
const User = require('../models/User');
const { signToken } = require('../utils/jwtHelper');

const getTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// POST /api/auth/otp/send
const sendOtp = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const hash = await bcrypt.hash(code, 10);

    // Remove any previous OTP for this email
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Store plaintext password — User.create() pre-save hook will hash it
    await Otp.create({
      email:    email.toLowerCase(),
      userData: { name, password },
      hash,
    });

    await getTransporter().sendMail({
      from:    `"FileSystem" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: 'Your verification code',
      text:    `Your FileSystem verification code is: ${code}\n\nIt expires in 10 minutes.`,
      html:    `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;background:#09090b;border-radius:12px;color:#fafafa;">
          <div style="font-size:22px;font-weight:700;margin-bottom:8px;">FileSystem</div>
          <p style="color:#a1a1aa;margin-bottom:24px;">Enter this code to verify your email address.</p>
          <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#6366f1;text-align:center;padding:16px 0;">${code}</div>
          <p style="color:#71717a;font-size:13px;margin-top:24px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/otp/verify
const verifyOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    const record = await Otp.findOne({ email: email.toLowerCase() });
    if (!record) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    const valid = await record.verify(code);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // Create the user with the pre-hashed password
    const user = await User.create({
      name:     record.userData.name,
      email:    email.toLowerCase(),
      password: record.userData.password,
    });

    await Otp.deleteMany({ email: email.toLowerCase() });

    const token = signToken(user._id, user.email);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendOtp, verifyOtp };
