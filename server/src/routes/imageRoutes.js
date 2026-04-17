const express = require('express');
const router = express.Router();
const {
  uploadImages,
  getImagesByFolder,
  getImage,
  deleteImage,
} = require('../controllers/imageController');
const { protect } = require('../middleware/auth');
const { uploadImages: multerUploadImages } = require('../utils/multerConfig');

router.use(protect);

router.post('/upload', multerUploadImages, uploadImages);
router.get('/folder/:folderId', getImagesByFolder);
router.get('/:imageId', getImage);
router.delete('/:imageId', deleteImage);

module.exports = router;
