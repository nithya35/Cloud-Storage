const File = require('../models/fileModel');
const Folder = require('../models/folderModel');
const catchAsync = require('../utils/catchAsync');

const getFileType = (contentType) => {
  if (!contentType) return 'other';
  if (contentType.startsWith('image/')) return 'image';
  if (contentType === 'application/pdf') return 'pdf';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  if (
    contentType === 'application/msword' ||
    contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) return 'doc';
  return 'other';
};

const convertToGB = (bytes) => {
  const gb = bytes / (1024 ** 3);
  return gb < 0.01 && gb > 0 ? '<0.01' : +gb.toFixed(2);
};

exports.getStorageStats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const files = await File.find({ user: userId });
  const folders = await Folder.find({ user: userId });

  let activeStorage = 0;
  let trashStorage = 0;

  const activeByType = { image: 0, pdf: 0, video: 0, audio: 0, doc: 0, other: 0 };
  const trashByType = { image: 0, pdf: 0, video: 0, audio: 0, doc: 0, other: 0 };

  const activeFileCounts = { image: 0, pdf: 0, video: 0, audio: 0, doc: 0, other: 0 };
  const trashFileCounts = { image: 0, pdf: 0, video: 0, audio: 0, doc: 0, other: 0 };

  let activeFiles = 0;
  let trashedFiles = 0;

  for (const file of files) {
    const type = getFileType(file.contentType);
    if (file.isTrashed) {
      trashStorage += file.size;
      trashByType[type] += file.size;
      trashFileCounts[type] += 1;
      trashedFiles++;
    } else {
      activeStorage += file.size;
      activeByType[type] += file.size;
      activeFileCounts[type] += 1;
      activeFiles++;
    }
  }

  const activeFolders = folders.filter(f => !f.isTrashed).length;
  const trashedFolders = folders.filter(f => f.isTrashed).length;

  res.status(200).json({
    status: 'success',
    data: {
      totalStorageGB: convertToGB(activeStorage + trashStorage),

      active: {
        storageGB: convertToGB(activeStorage),
        storageByTypeGB: {
          image: convertToGB(activeByType.image),
          pdf: convertToGB(activeByType.pdf),
          video: convertToGB(activeByType.video),
          audio: convertToGB(activeByType.audio),
          doc: convertToGB(activeByType.doc),
          other: convertToGB(activeByType.other)
        },
        totalFiles: activeFiles,
        filesByType: activeFileCounts,
        totalFolders: activeFolders
      },

      trash: {
        storageGB: convertToGB(trashStorage),
        storageByTypeGB: {
          image: convertToGB(trashByType.image),
          pdf: convertToGB(trashByType.pdf),
          video: convertToGB(trashByType.video),
          audio: convertToGB(trashByType.audio),
          doc: convertToGB(trashByType.doc),
          other: convertToGB(trashByType.other)
        },
        totalFiles: trashedFiles,
        filesByType: trashFileCounts,
        totalFolders: trashedFolders
      }
    }
  });
});

exports.getRecentFiles = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 10;

  const ownFiles = await File.find({
    user: userId,
    isTrashed: false
  })
    .populate('folder', 'name')
    .sort('-updatedAt')
    .limit(limit)
    .lean(); // lean() to allow modifying returned objects

  for (const file of ownFiles) {
    file.uploadedBy = {
      _id: userId,
      name: req.user.name,
      email: req.user.email
    };
  }

  const sharedFiles = await File.find({
    isTrashed: false,
    'sharedWith.user': userId
  })
    .populate('folder', 'name')
    .populate('user', 'name email')
    .sort('-updatedAt')
    .limit(limit)
    .lean();

  for (const file of sharedFiles) {
    file.uploadedBy = {
      _id: file.user._id,
      name: file.user.name,
      email: file.user.email
    };
    delete file.user;
  }

  const allFiles = [...ownFiles, ...sharedFiles]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, limit);

  res.status(200).json({
    status: 'success',
    results: allFiles.length,
    data: { files: allFiles }
  });
});