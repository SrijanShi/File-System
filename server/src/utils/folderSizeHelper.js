const Image = require('../models/Image');
const Folder = require('../models/Folder');

const getFolderSize = async (folderId, ownerId) => {
  const images = await Image.find({ folder: folderId, owner: ownerId }, 'size');
  const directSize = images.reduce((sum, img) => sum + img.size, 0);

  const subFolders = await Folder.find({ parent: folderId, owner: ownerId }, '_id');
  if (subFolders.length === 0) return directSize;

  const subSizes = await Promise.all(
    subFolders.map((sf) => getFolderSize(sf._id, ownerId))
  );

  return directSize + subSizes.reduce((sum, s) => sum + s, 0);
};

module.exports = { getFolderSize };
