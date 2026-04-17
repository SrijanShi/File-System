const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
    },
    thumbnail: {
      filename: { type: String, default: null },
      url:      { type: String, default: null },
      size:     { type: Number, default: 0 },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

folderSchema.index({ owner: 1, parent: 1 });

module.exports = mongoose.model('Folder', folderSchema);
