const fs = require('fs');
const path = require('path');
const Folder = require('../models/Folder');
const Image = require('../models/Image');
const { getFolderSize } = require('../utils/folderSizeHelper');
const { UPLOADS_DIR } = require('../utils/multerConfig');

const buildFolderResponse = async (folder, ownerId) => {
  const size = await getFolderSize(folder._id, ownerId);
  return { ...folder.toObject(), size };
};

const createFolder = async (req, res, next) => {
  try {
    const { name, parentId } = req.body;

    if (!name || !name.trim()) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Folder name is required' });
    }

    if (parentId) {
      const parent = await Folder.findOne({ _id: parentId, owner: req.user._id });
      if (!parent) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(403).json({ error: 'Parent folder not found or access denied' });
      }
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const thumbnail = req.file
      ? { filename: req.file.filename, url: `${baseUrl}/uploads/${req.file.filename}`, size: req.file.size }
      : { filename: null, url: null, size: 0 };

    const folder = await Folder.create({
      name: name.trim(),
      thumbnail,
      parent: parentId || null,
      owner: req.user._id,
    });

    res.status(201).json({
      message: 'Folder created',
      folder: { ...folder.toObject(), size: 0 },
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

const getRootFolders = async (req, res, next) => {
  try {
    const folders = await Folder.find({ owner: req.user._id, parent: null }).sort({ createdAt: -1 });
    const withSizes = await Promise.all(folders.map((f) => buildFolderResponse(f, req.user._id)));
    res.status(200).json({ folders: withSizes });
  } catch (err) {
    next(err);
  }
};

const getFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.folderId, owner: req.user._id });
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const [size, subfolders, images] = await Promise.all([
      getFolderSize(folder._id, req.user._id),
      Folder.find({ parent: folder._id, owner: req.user._id }).sort({ createdAt: -1 }),
      Image.find({ folder: folder._id, owner: req.user._id }).sort({ createdAt: -1 }),
    ]);

    const subfoldersWithSize = await Promise.all(
      subfolders.map((sf) => buildFolderResponse(sf, req.user._id))
    );

    res.status(200).json({
      folder: { ...folder.toObject(), size },
      subfolders: subfoldersWithSize,
      images,
    });
  } catch (err) {
    next(err);
  }
};

const getFolderChildren = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.folderId, owner: req.user._id });
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const subfolders = await Folder.find({ parent: folder._id, owner: req.user._id }).sort({ createdAt: -1 });
    const withSizes = await Promise.all(subfolders.map((sf) => buildFolderResponse(sf, req.user._id)));

    res.status(200).json({ subfolders: withSizes });
  } catch (err) {
    next(err);
  }
};

const updateFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.folderId, owner: req.user._id });
    if (!folder) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (req.body.name && req.body.name.trim()) {
      folder.name = req.body.name.trim();
    }

    if (req.file) {
      const oldFilename = folder.thumbnail.filename;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      folder.thumbnail = {
        filename: req.file.filename,
        url: `${baseUrl}/uploads/${req.file.filename}`,
        size: req.file.size,
      };
      fs.unlink(path.join(UPLOADS_DIR, oldFilename), () => {});
    }

    await folder.save();
    const size = await getFolderSize(folder._id, req.user._id);

    res.status(200).json({
      message: 'Folder updated',
      folder: { ...folder.toObject(), size },
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

const deleteFolder = async (req, res, next) => {
  try {
    const root = await Folder.findOne({ _id: req.params.folderId, owner: req.user._id });
    if (!root) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // BFS to collect all descendant folder IDs
    const allFolderIds = [root._id];
    const queue = [root._id];

    while (queue.length > 0) {
      const batch = [...queue];
      queue.length = 0;
      const children = await Folder.find(
        { parent: { $in: batch }, owner: req.user._id },
        '_id'
      );
      for (const child of children) {
        queue.push(child._id);
        allFolderIds.push(child._id);
      }
    }

    // Collect image files and unlink
    const images = await Image.find({ folder: { $in: allFolderIds }, owner: req.user._id }, 'filename');
    for (const img of images) {
      fs.unlink(path.join(UPLOADS_DIR, img.filename), () => {});
    }

    // Unlink folder thumbnails
    const folders = await Folder.find({ _id: { $in: allFolderIds } }, 'thumbnail.filename');
    for (const f of folders) {
      if (f.thumbnail?.filename) fs.unlink(path.join(UPLOADS_DIR, f.thumbnail.filename), () => {});
    }

    await Image.deleteMany({ folder: { $in: allFolderIds }, owner: req.user._id });
    await Folder.deleteMany({ _id: { $in: allFolderIds }, owner: req.user._id });

    res.status(200).json({ message: 'Folder and all contents deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFolder,
  getRootFolders,
  getFolder,
  getFolderChildren,
  updateFolder,
  deleteFolder,
};
