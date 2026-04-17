const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const imageRoutes = require('./routes/imageRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(morgan('dev'));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/images', imageRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use(errorHandler);

module.exports = app;
