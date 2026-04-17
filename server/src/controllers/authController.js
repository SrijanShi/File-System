const User = require('../models/User');
const { signToken } = require('../utils/jwtHelper');

const signup = async (req, res, next) => {
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

    const user = await User.create({ name, email, password });
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

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user._id, user.email);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

const logout = (_req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

const me = (req, res) => {
  res.status(200).json({ user: { _id: req.user._id, name: req.user.name, email: req.user.email } });
};

module.exports = { signup, login, logout, me };
