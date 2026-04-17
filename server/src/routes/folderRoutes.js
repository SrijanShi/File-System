const express = require('express');
const router = express.Router();
const {
  createFolder,
  getRootFolders,
  getFolder,
  getFolderChildren,
  updateFolder,
  deleteFolder,
} = require('../controllers/folderController');
const { protect } = require('../middleware/auth');
const { uploadThumbnail } = require('../utils/multerConfig');

router.use(protect);

router.post('/', uploadThumbnail, createFolder);
router.get('/', getRootFolders);
router.get('/:folderId', getFolder);
router.get('/:folderId/children', getFolderChildren);
router.patch('/:folderId', uploadThumbnail, updateFolder);
router.delete('/:folderId', deleteFolder);

module.exports = router;
