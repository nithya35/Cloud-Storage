const File = require('../models/fileModel');
const Folder = require('../models/folderModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');

exports.restoreFile = catchAsync(async (req, res, next) => {
  const file = await File.findById(req.params.id);
  if (!file || !file.isTrashed) {
    return next(new AppError('File not found or not in trash', 404));
  }

  const isOwner = file.user.equals(req.user._id);
  const hasAccess = file.sharedWith?.some(
    (s) => s.user?.toString() === req.user._id.toString()
  );

  if (!isOwner && !hasAccess) {
    return next(new AppError('You do not have permission to restore this file', 403));
  }

  if (!file.folder) {
    file.isTrashed = false;
    file.trashedAt = null;
    await file.save();
  } else {
    const parent = await Folder.findById(file.folder);

    if (!parent) {
      file.folder = null;
      file.isTrashed = false;
      file.trashedAt = null;
      await file.save();
    } else if (parent.isTrashed) {
      return next(new AppError('Cannot restore file because its parent folder is in trash', 400));
    } else {
      const canAccessParent =
        parent.user.equals(req.user._id) ||
        parent.sharedWith?.some(
          (s) => s.user?.toString() === req.user._id.toString()
        );

      if (!canAccessParent) {
        return next(new AppError('You do not have access to parent folder', 403));
      }

      file.isTrashed = false;
      file.trashedAt = null;
      await file.save();
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'File restored successfully'
  });
});

exports.restoreFolder = catchAsync(async (req, res, next) => {
  const folder = await Folder.findOne({
    _id: req.params.id,
    isTrashed: true
  });

  if (!folder) {
    return next(new AppError('Folder not found or not in trash', 404));
  }

  const isOwner = folder.user.equals(req.user._id);
  const hasAccess = folder.sharedWith?.some(
    (s) => s.user?.toString() === req.user._id.toString()
  );

  if (!isOwner && !hasAccess) {
    return next(new AppError('You do not have permission to restore this folder', 403));
  }

  if (!folder.parent) {
    folder.isTrashed = false;
    folder.trashedAt = null;
    await folder.save();
  } else {
    const parent = await Folder.findById(folder.parent);

    if (!parent) {
      folder.parent = null;
      folder.isTrashed = false;
      folder.trashedAt = null;
      await folder.save();
    } else if (parent.isTrashed) {
      return next(new AppError('Cannot restore folder because its parent is in trash', 400));
    } else {
      const canAccessParent =
        parent.user.equals(req.user._id) ||
        parent.sharedWith?.some(
          (s) => s.user?.toString() === req.user._id.toString()
        );

      if (!canAccessParent) {
        return next(new AppError('You do not have access to parent folder', 403));
      }

      folder.isTrashed = false;
      folder.trashedAt = null;
      await folder.save();
    }
  }

  await restoreFolderAndContents(folder._id, folder.user);

  res.status(200).json({
    status: 'success',
    message: 'Folder restored successfully'
  });
});

const restoreFolderAndContents = async (folderId, userId) => {
  await File.updateMany(
    { folder: folderId, user: userId, isTrashed: true },
    { isTrashed: false, trashedAt: null }
  );

  await Folder.updateMany(
    { parent: folderId, user: userId, isTrashed: true },
    { isTrashed: false, trashedAt: null }
  );

  const subfolders = await Folder.find({ parent: folderId, user: userId });
  for (const sub of subfolders) {
    await restoreFolderAndContents(sub._id, userId);
  }
};

exports.deleteFilePermanently = catchAsync(async (req, res, next) => {
  const file = await File.findOne({ _id: req.params.id, user: req.user._id });

  if (!file || !file.isTrashed) {
    return next(new AppError('File not found or not in trash', 404));
  }

  const db = mongoose.connection.db;
  await db.collection('uploads.files').deleteOne({ _id: file.fileId });
  await db.collection('uploads.chunks').deleteMany({ files_id: file.fileId });

  await File.deleteOne({ _id: file._id });

  res.status(204).json({ status: 'success', data: null });
});

exports.deleteFolderPermanently = catchAsync(async (req, res, next) => {
  const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });

  if (!folder || !folder.isTrashed) {
    return next(new AppError('Folder not found or not in trash', 404));
  }

  await deleteFolderAndContents(folder._id, req.user._id);
  await Folder.deleteOne({ _id: folder._id });

  res.status(204).json({ status: 'success', data: null });
});

const deleteFolderAndContents = async (folderId, userId) => {
  const files = await File.find({ folder: folderId, user: userId, isTrashed: true });
  const db = mongoose.connection.db;

  for (const file of files) {
    await db.collection('uploads.files').deleteOne({ _id: file.fileId });
    await db.collection('uploads.chunks').deleteMany({ files_id: file.fileId });
  }

  await File.deleteMany({ folder: folderId, user: userId, isTrashed: true });

  const subfolders = await Folder.find({ parent: folderId, user: userId, isTrashed: true });

  for (const sub of subfolders) {
    await deleteFolderAndContents(sub._id, userId);
    await Folder.deleteOne({ _id: sub._id });
  }
};

exports.autoDeleteOldTrash = async () => {
  try{
    const thresholdDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const expiredFiles = await File.find({
      isTrashed: true,
      trashedAt: { $lte: thresholdDate }
    });

    const db = mongoose.connection.db;
    for (const file of expiredFiles) {
      await db.collection('uploads.files').deleteOne({ _id: file.fileId });
      await db.collection('uploads.chunks').deleteMany({ files_id: file.fileId });
    }

    await File.deleteMany({ _id: { $in: expiredFiles.map(f => f._id) } });

    const expiredFolders = await Folder.find({
      isTrashed: true,
      trashedAt: { $lte: thresholdDate }
    });

    for (const folder of expiredFolders) {
      await deleteFolderAndContents(folder._id, folder.user);
      await Folder.deleteOne({ _id: folder._id });
    }
    console.log("Auto-delete completed successfully");
  } catch (err) {
    console.error("Error during auto-delete:", err);
  }
};

exports.emptyAllTrash = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const trashedFiles = await File.find({ user: userId, isTrashed: true });

  const db = mongoose.connection.db;
  for (const file of trashedFiles) {
    if (file.fileId) { 
      await db.collection('uploads.files').deleteOne({ _id: file.fileId });
      await db.collection('uploads.chunks').deleteMany({ files_id: file.fileId });
    }
  }

  await File.deleteMany({ user: userId, isTrashed: true });

  const trashedFolders = await Folder.find({ user: userId, isTrashed: true });
  for (const folder of trashedFolders) {
    await deleteFolderAndContents(folder._id, userId);
  }
  await Folder.deleteMany({ user: userId, isTrashed: true });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
