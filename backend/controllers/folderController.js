const mongoose = require('mongoose');
const Folder = require('../models/folderModel');
const File = require('../models/fileModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const isEditor = (folder, userId) => {
  return folder.sharedWith?.some(
    share => share.user?.toString() === userId.toString() && share.permission === 'editor'
  );
};

exports.createFolder = catchAsync(async (req, res, next) => {
  const parentId = req.body.parent || null;
  let ownerId = req.user._id;

  if (parentId) {
    const parentFolder = await Folder.findById(parentId);
    if (!parentFolder || parentFolder.isTrashed) {
      return next(new AppError('Invalid or trashed parent folder', 400));
    }

    const isParentOwner = parentFolder.user.equals(req.user._id);
    const isParentEditor = isEditor(parentFolder, req.user._id);
    if (!isParentOwner && !isParentEditor) {
      return next(new AppError('No permission to create inside this folder', 403));
    }

    ownerId = parentFolder.user;
  }

  const newFolder = await Folder.create({
    name: req.body.name,
    parent: parentId,
    user: ownerId
  });

  if (!ownerId.equals(req.user._id)) {
    newFolder.sharedWith.push({
      user: req.user._id,
      email: req.user.email,
      permission: 'editor'
    });
    await newFolder.save();
  }

  res.status(201).json({
    status: 'success',
    data: { folder: newFolder }
  });
});

exports.listTrashedFolders = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const folders = await Folder.find({ user: userId, isTrashed: true }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: folders.length,
    data: { folders },
  });
});

exports.getFolders = catchAsync(async (req, res, next) => {
  const query = {
    user: req.user._id,
    isTrashed: false
  };

  if (req.query.parent !== undefined) {
    query.parent = req.query.parent || null;
  }

  const folders = await Folder.find(query);

  res.status(200).json({
    status: 'success',
    results: folders.length,
    data: { folders }
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

exports.renameFolder = catchAsync(async (req, res, next) => {
  const folder = await Folder.findById(req.params.id);
  if (!folder || folder.isTrashed) return next(new AppError('Folder not found or trashed', 404));

  if (!folder.user.equals(req.user._id)) {
    if (!folder.parent) {
      return next(new AppError('You cannot rename this root shared folder', 403));
    }

    const hasEditorInFolder = hasEditorAccess(folder, req.user._id);
    const hasEditorInPath = await hasFullEditorAccessToPath(folder.parent, req.user._id);

    if (!hasEditorInFolder || !hasEditorInPath) {
      return next(new AppError('You do not have permission to rename this folder', 403));
    }
  }

  folder.name = req.body.name;
  await folder.save();
  res.status(200).json({ status: 'success', data: { folder } });
});

exports.moveFolder = catchAsync(async (req, res, next) => {
  const folder = await Folder.findById(req.params.id);
  if (!folder || folder.isTrashed) {
    return next(new AppError('Folder not found or already in trash', 404));
  }

  const targetFolderId = req.body.parent || null;
  let targetFolder = null;

  if (targetFolderId !== null) {
    targetFolder = await Folder.findById(targetFolderId);
    if (!targetFolder || targetFolder.isTrashed) {
      return next(new AppError('Target folder is invalid or trashed', 400));
    }
  }

  if (folder._id.equals(targetFolderId)) {
    return next(new AppError('Cannot move a folder into itself', 400));
  }

  const isSubfolder = await isDescendantFolder(folder._id, targetFolderId);
  if (isSubfolder) {
    return next(new AppError('Cannot move a folder into its subfolder', 400));
  }

  if (folder.user.equals(req.user._id)) {
    if (targetFolder && !targetFolder.user.equals(req.user._id)) {
      return next(new AppError('Owner can only move folders within their own hierarchy', 403));
    }
  } else {
    const hasEditorInFolder = hasEditorAccess(folder, req.user._id);

    if (targetFolderId === null) {
      if (!folder.parent) {
        return next(new AppError('Insufficient access to move a root-level shared folder.', 403));
      }
      const hasEditorInSourcePath = await hasFullEditorAccessToPath(folder.parent, req.user._id);
      if (!hasEditorInFolder || !hasEditorInSourcePath) {
        return next(new AppError('Insufficient access to move folder.', 403));
      }
    } else {
      const hasEditorInNew = hasEditorAccess(targetFolder, req.user._id);

      if (!folder.parent) {
        return next(new AppError('Insufficient access to move a root-level shared folder.', 403));
      }

      const hasEditorInSourcePath = await hasFullEditorAccessToPath(folder.parent, req.user._id);
      const hasEditorInTargetPath = await hasFullEditorAccessToPath(targetFolder, req.user._id);

      if (
        !hasEditorInFolder ||
        !hasEditorInNew ||
        !hasEditorInSourcePath ||
        !hasEditorInTargetPath
      ) {
        return next(new AppError('Insufficient access to move folder. Requires editor access to folder, target folder, and full editor access to source and target paths.', 403));
      }

      if (!folder.user.equals(targetFolder.user)) {
        return next(new AppError('Cross-owner folder moves are not permitted for this user.', 403));
      }
    }
  }

  folder.parent = targetFolderId;
  await folder.save();

  res.status(200).json({ status: 'success', data: { folder } });
});

const isDescendantFolder = async (parentId, targetId) => {
  let current = await Folder.findById(targetId);
  while (current) {
    if (current.parent?.equals(parentId)) return true;
    current = await Folder.findById(current.parent);
  }
  return false;
};

exports.trashFolder = catchAsync(async (req, res, next) => {
  const folder = await Folder.findById(req.params.id);
  if (!folder || folder.isTrashed)
    return next(new AppError('Folder not found or already in trash', 404));

  if (!folder.user.equals(req.user._id)) {
    if (!folder.parent) {
      return next(new AppError('You cannot delete this root shared folder', 403));
    }

    const hasEditorInFolder = hasEditorAccess(folder, req.user._id);
    const hasEditorInPath = await hasFullEditorAccessToPath(folder.parent, req.user._id);

    if (!hasEditorInFolder || !hasEditorInPath)
      return next(new AppError('You do not have permission to delete this folder', 403));
  }
  await recursivelyTrashFolder(folder._id);

  res.status(204).json({ status: 'success', data: null });
});

const recursivelyTrashFolder = async (folderId) => {
  await Folder.findByIdAndUpdate(folderId, {
    isTrashed: true,
    trashedAt: Date.now()
  });

  await File.updateMany({ folder: folderId, isTrashed: false }, {
    isTrashed: true,
    trashedAt: Date.now()
  });

  const subfolders = await Folder.find({ parent: folderId, isTrashed: false });
  for (const sub of subfolders) {
    await recursivelyTrashFolder(sub._id);
  }
};
