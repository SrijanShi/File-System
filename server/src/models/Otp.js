const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  // Temporary user data held until OTP is verified
  userData: {
    name:     { type: String },
    password: { type: String }, // already hashed
  },
  hash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // TTL: 10 minutes
  },
});

otpSchema.methods.verify = function (candidate) {
  return bcrypt.compare(String(candidate), this.hash);
};

module.exports = mongoose.model('Otp', otpSchema);
