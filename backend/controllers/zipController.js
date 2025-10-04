const mongoose = require('mongoose');
const archiver = require('archiver');
const { GridFSBucket, ObjectId } = require('mongodb');

const File = require('../models/fileModel');
const Folder = require('../models/folderModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const hasAccess = (resource, userId) =>
  resource.user.equals(userId) ||
  resource.sharedWith?.some(s => s.user?.toString() === userId.toString());

exports.downloadFileAsZip = catchAsync(async (req, res, next) => {
  const file = await File.findById(req.params.id);
  if (!file || file.isTrashed)
    return next(new AppError('File not found or in trash', 404));

  if (!hasAccess(file, req.user._id))
    return next(new AppError('You do not have access to this file', 403));

  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${file.filename}.zip"`
  );

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  const stream = bucket.openDownloadStream(new ObjectId(file.fileId));
  archive.append(stream, { name: file.filename });

  archive.finalize();
});

exports.downloadFolderAsZip = catchAsync(async (req, res, next) => {
  const folder = await Folder.findById(req.params.id);
  if (!folder || folder.isTrashed)
    return next(new AppError('Folder not found or in trash', 404));

  if (!hasAccess(folder, req.user._id))
    return next(new AppError('You do not have access to this folder', 403));

  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${folder.name}.zip"`
  );

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  const addFolderToZip = async (folder, currentPath) => {
    const files = await File.find({ folder: folder._id, isTrashed: false });

    for (const file of files) {
      if (hasAccess(file, req.user._id)) {
        const stream = bucket.openDownloadStream(new ObjectId(file.fileId));
        archive.append(stream, { name: `${currentPath}/${file.filename}` });
      }
    }

    const subfolders = await Folder.find({
      parent: folder._id,
      isTrashed: false
    });

    for (const sub of subfolders) {
      if (hasAccess(sub, req.user._id)) {
        await addFolderToZip(sub, `${currentPath}/${sub.name}`);
      }
    }
  };

  await addFolderToZip(folder, folder.name);

  archive.finalize();
});
