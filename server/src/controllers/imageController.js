const fs = require('fs');
const path = require('path');
const Image = require('../models/Image');
const Folder = require('../models/Folder');
const { UPLOADS_DIR } = require('../utils/multerConfig');

const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { folderId } = req.body;
    if (!folderId) {
      for (const f of req.files) fs.unlink(f.path, () => {});
      return res.status(400).json({ error: 'folderId is required' });
    }

    const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
    if (!folder) {
      for (const f of req.files) fs.unlink(f.path, () => {});
      return res.status(403).json({ error: 'Folder not found or access denied' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const docs = req.files.map((file) => ({
      name: file.originalname,
      filename: file.filename,
      url: `${baseUrl}/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      folder: folder._id,
      owner: req.user._id,
    }));

    const images = await Image.insertMany(docs);

    res.status(201).json({
      message: `${images.length} image(s) uploaded`,
      images,
    });
  } catch (err) {
    if (req.files) {
      for (const f of req.files) fs.unlink(f.path, () => {});
    }
    next(err);
  }
};

const getImagesByFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.folderId, owner: req.user._id });
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const images = await Image.find({ folder: folder._id, owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ images });
  } catch (err) {
    next(err);
  }
};

const getImage = async (req, res, next) => {
  try {
    const image = await Image.findOne({ _id: req.params.imageId, owner: req.user._id });
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.status(200).json({ image });
  } catch (err) {
    next(err);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const image = await Image.findOne({ _id: req.params.imageId, owner: req.user._id });
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    fs.unlink(path.join(UPLOADS_DIR, image.filename), () => {});
    await image.deleteOne();

    res.status(200).json({ message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImages, getImagesByFolder, getImage, deleteImage };
