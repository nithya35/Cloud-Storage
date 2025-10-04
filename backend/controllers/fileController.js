const stream = require('stream');
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const { promisify } = require('util');

const File = require('../models/fileModel');
const Folder = require('../models/folderModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const hasEditorAccess = (resource, userId) => {
  return resource.sharedWith?.some(
    s => s.user?.toString() === userId.toString() && s.permission === 'editor'
  );
};

const hasAccess = (file, userId) => {
  if (file.user.equals(userId)) return true;
  return file.sharedWith.some(s => s.user?.equals(userId));
};

const calculateUserStorageUsed = async (userId) => {
  const files = await File.find({ user: userId });
  return files.reduce((acc, file) => acc + file.size, 0);
};

exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded!', 400));

  const folderId = req.body.folder || null;
  let ownerId = req.user._id;
  let folder = null;

  if (folderId) {
    folder = await Folder.findById(folderId);
    if (!folder || folder.isTrashed) {
      return next(new AppError('Invalid or trashed folder ID', 400));
    }

    const isOwner = folder.user.equals(req.user._id);
    const isEditor = folder.sharedWith?.some(
      (share) => share.user?.toString() === req.user._id.toString() && share.permission === 'editor'
    );

    if (!isOwner && !isEditor) {
      return next(new AppError('You do not have permission to upload here', 403));
    }

    ownerId = folder.user;
  }

  const currentStorage = await calculateUserStorageUsed(ownerId);
  const newSize = req.file.size;
  if (currentStorage + newSize > process.env.MAX_STORAGE_BYTES) {
    return next(new AppError('Storage quota exceeded (5GB limit)', 403));
  }

  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  const existing = await File.findOne({ filename: req.file.originalname, user: ownerId, folder: folderId });
  if (existing) {
    await db.collection('uploads.files').deleteOne({ _id: existing.fileId });
    await db.collection('uploads.chunks').deleteMany({ files_id: existing.fileId });
    await File.deleteOne({ _id: existing._id });
  }

  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  const uploadStream = bucket.openUploadStream(req.file.originalname, {
    contentType: req.file.mimetype
  });

  bufferStream.pipe(uploadStream);

  await promisify(stream.finished)(uploadStream);

  const newFile = await File.create({
    filename: req.file.originalname,
    fileId: uploadStream.id,
    size: req.file.size,
    contentType: req.file.mimetype,
    user: ownerId,
    folder: folderId
  });

  if (!ownerId.equals(req.user._id)) {
    newFile.sharedWith.push({
      user: req.user._id,
      email: req.user.email,
      permission: 'editor'
    });
    await newFile.save();
  }

  res.status(201).json({
    status: 'success',
    data: { file: newFile }
  });
});

const streamFile = (dispositionType) => {
  return catchAsync(async (req, res, next) => {
    const fileMeta = await File.findById(req.params.id);

    if (!fileMeta)
      return next(new AppError('File not found', 404));

    if (!hasAccess(fileMeta, req.user._id))
      return next(new AppError('You do not have permission to access this file', 403));

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const downloadStream = bucket.openDownloadStream(new ObjectId(fileMeta.fileId));

    res.set('Content-Type', fileMeta.contentType);
    res.set('Content-Disposition', `${dispositionType}; filename="${fileMeta.filename}"`);

    downloadStream.on('error', () => {
      return next(new AppError('Error reading the file', 500));
    });

    downloadStream.pipe(res);
  });
};

exports.previewFile = streamFile('inline');
exports.downloadFile = streamFile('attachment');

exports.listTrashedFiles = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const files = await File.find({ user: userId, isTrashed: true }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: files.length,
    data: { files },
  });
});

exports.listFiles = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const queryObj = { user: userId, isTrashed: false };

  if (req.query.folder) {
    const folder = await Folder.findOne({ _id: req.query.folder, user: userId, isTrashed: false });
    if (!folder) return next(new AppError('Invalid or trashed folder ID', 400));
    queryObj.folder = req.query.folder;
  }

  if (req.query.search) {
    queryObj.filename = { $regex: req.query.search, $options: 'i' };
  }

  if (req.query.from || req.query.to) {
    queryObj.createdAt = {};
    if (req.query.from) queryObj.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) queryObj.createdAt.$lte = new Date(req.query.to);
  }

  if (req.query.type) {
    const type = req.query.type.toLowerCase();
    if (type === 'image') queryObj.contentType = { $regex: '^image/', $options: 'i' };
    else if (type === 'pdf') queryObj.contentType = 'application/pdf';
    else if (type === 'video') queryObj.contentType = { $regex: '^video/', $options: 'i' };
    else if (type === 'audio') queryObj.contentType = { $regex: '^audio/', $options: 'i' };
    else if (type === 'doc') {
      queryObj.contentType = {
        $in: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      };
    }
  }

  let query = File.find(queryObj);
  if (req.query.sort) {
    query = query.sort(req.query.sort.split(',').join(' '));
  } else {
    query = query.sort('-createdAt');
  }

  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  const files = await query;

  res.status(200).json({
    status: 'success',
    results: files.length,
    data: { files }
  });
});

const hasFullEditorAccessToPath = async (folderId, userId) => {
  let current = await Folder.findById(folderId);

  while (current) {
    const hasEditor = current.sharedWith?.some(
      (s) => s.user?.toString() === userId.toString() && s.permission === 'editor'
    );

    if (!hasEditor) return false;

    if (!current.parent) break;
    current = await Folder.findById(current.parent);
  }

  return true;
};

exports.renameFile = catchAsync(async (req, res, next) => {
  if(!req.body.filename){
    return next(new AppError('Please provide new filename',404));
  }
  const file = await File.findById(req.params.id);
  if (!file || file.isTrashed) return next(new AppError('File not found or in trash', 404));

  if (!file.user.equals(req.user._id)) {
    if(!file.folder){
      return next(new AppError('You do not have permission to rename this file', 403));
    }
    const hasEditorInFile = hasEditorAccess(file, req.user._id);
    const hasEditorInPath = hasFullEditorAccessToPath(file.folder, req.user._id);

    if (!hasEditorInFile || !hasEditorInPath)
      return next(new AppError('You do not have permission to rename this file', 403));
  }

  file.filename = req.body.filename;
  await file.save();

  res.status(200).json({ status: 'success', data: { file } });
});

exports.moveFile = catchAsync(async (req, res, next) => {
  const file = await File.findById(req.params.id);
  if (!file || file.isTrashed) {
    return next(new AppError('File not found', 404));
  }

  const targetFolderId = req.body.folder || null;
  let targetFolder = null;

  if (targetFolderId !== null) {
    targetFolder = await Folder.findById(targetFolderId);
    if (!targetFolder || targetFolder.isTrashed) {
      return next(new AppError('Target folder invalid or not found', 400));
    }
  }

  if (file.user.equals(req.user._id)) {
    if (targetFolder && !targetFolder.user.equals(req.user._id)) {
      return next(new AppError('Owner can only move files within their own folders.', 403));
    }
  } else {
    const hasEditorInFile = hasEditorAccess(file, req.user._id);

    if (targetFolderId === null) {
      if (!file.folder) {
        return next(new AppError('Insufficient access to move file to root. Editor access to parent required.', 403));
      }
      const hasEditorInSourcePath = await hasFullEditorAccessToPath(file.folder, req.user._id);
      if (!hasEditorInFile || !hasEditorInSourcePath) {
        return next(new AppError('Insufficient access to move file.', 403));
      }
    } else {
      const hasEditorInNew = hasEditorAccess(targetFolder, req.user._id);

      if (!file.folder) {
        return next(new AppError('Insufficient access to move a root-level shared file.', 403));
      }

      const hasEditorInSourcePath = await hasFullEditorAccessToPath(file.folder, req.user._id);
      const hasEditorInTargetPath = await hasFullEditorAccessToPath(targetFolder, req.user._id);

      if (
        !hasEditorInFile ||
        !hasEditorInNew ||
        !hasEditorInSourcePath ||
        !hasEditorInTargetPath
      ) {
        return next(new AppError('Insufficient access to move file. Requires editor access to file, target folder, and full editor access to source and target paths.', 403));
      }

      if (!file.user.equals(targetFolder.user)) {
        return next(new AppError('Cross-owner file moves are not permitted for this user.', 403));
      }
    }
  }

  file.folder = targetFolderId;
  await file.save();

  res.status(200).json({ status: 'success', data: { file } });
});

exports.deleteFile = catchAsync(async (req, res, next) => {
  const file = await File.findById(req.params.id);
  if (!file || file.isTrashed) return next(new AppError('File not found or already in trash', 404));

  if (!file.user.equals(req.user._id)) {
    if(!file.folder){
      return next(new AppError('No permission to delete this file',403));
    }
    const hasEditorInFile = hasEditorAccess(file, req.user._id);
    const hasEditorInPath = hasFullEditorAccessToPath(file.folder, req.user._id);

    if (!hasEditorInFile || !hasEditorInPath)
      return next(new AppError('No permission to delete this file', 403));
  }

  file.isTrashed = true;
  file.trashedAt = Date.now();
  await file.save();

  res.status(204).json({ status: 'success', data: null });
});
