const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A folder must have a name']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null // root folders have no parent
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

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;
