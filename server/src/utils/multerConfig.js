const multer = require('multer');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const limits = {
  fileSize: 10 * 1024 * 1024,
  files: 10,
};

const uploadThumbnail = multer({ storage, fileFilter, limits }).single('thumbnail');
const uploadImages = multer({ storage, fileFilter, limits }).array('images', 10);

module.exports = { uploadThumbnail, uploadImages, UPLOADS_DIR };
