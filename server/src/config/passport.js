const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error('No email from Google'), null);

        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

        if (user) {
          // Link Google ID if signing in via email account for the first time
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
        } else {
          user = await User.create({
            name:     profile.displayName || email.split('@')[0],
            email,
            googleId: profile.id,
            password: null,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
