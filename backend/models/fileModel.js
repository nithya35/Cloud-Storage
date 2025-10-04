const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true // original name uploaded by user
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // ID of the file stored in GridFS
  },
  size: Number,
  contentType: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  isTrashed: {
    type: Boolean,
    default: false
  },
  trashedAt: {
    type: Date,
    default: null
  },
  sharedWith: [
  {
    email: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer'
    }
  }
  ]
},
{
  timestamps: true
}
);

const File = mongoose.model('File',fileSchema);

module.exports = File;