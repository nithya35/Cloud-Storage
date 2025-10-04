const User = require('../models/userModel');
const File = require('../models/fileModel');
const Folder = require('../models/folderModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');
const crypto = require('crypto');

const getModelByType = (type) => {
  if (type === 'file') return File;
  if (type === 'folder') return Folder;
  throw new AppError('Invalid resource type', 400);
};

const findResource = async (type, id, ownerId) => {
  const Model = getModelByType(type);
  const resource = await Model.findOne({ _id: id, user: ownerId });
  if (!resource) throw new AppError(`${type} not found or not owned by user`, 404);
  return resource;
};

exports.shareResource = catchAsync(async (req, res, next) => {
  const { type, id } = req.params;
  const { email, permission } = req.body;

  if (!email || !permission) {
    return next(new AppError('Email and permission (viewer/editor) are required', 400));
  }

  const targetUser = await User.findOne({ email });
  if (!targetUser) return next(new AppError('User with this email does not exist', 404));
  if (targetUser._id.equals(req.user._id)) return next(new AppError('Cannot share with yourself', 400));

  const resource = await findResource(type, id, req.user._id);

  const alreadyShared = resource.sharedWith.find((entry) => entry.user?.equals(targetUser._id));
  if (alreadyShared) {
    alreadyShared.permission = permission;
  } else {
    resource.sharedWith.push({
      email,
      user: targetUser._id,
      permission
    });
  }

  await resource.save();

  if (type === 'folder') {
    await recursivelyShareFolder(id, targetUser, permission);
  }

  res.status(200).json({
    status: 'success',
    message: `${type} shared with ${email} as ${permission}`
  });
});

exports.unshareResource = catchAsync(async (req, res, next) => {
  const { type, id } = req.params;
  const { email } = req.body;

  if (!email) return next(new AppError('Email must be provided', 400));

  const targetUser = await User.findOne({ email });
  if (!targetUser) return next(new AppError('User with this email does not exist', 404));

  const resource = await findResource(type, id, req.user._id);

  resource.sharedWith = resource.sharedWith.filter(
    (entry) => !entry.user?.equals(targetUser._id)
  );
  await resource.save();

  if (type === 'folder') {
    await recursivelyUnshareFolder(id, targetUser._id);
  }

  res.status(200).json({
    status: 'success',
    message: `${type} and its contents unshared from ${email}`
  });
});

exports.getSharedUsers = catchAsync(async (req, res, next) => {
  const { type, id } = req.params;

  const resource = await findResource(type, id, req.user._id);

  res.status(200).json({
    status: 'success',
    results: resource.sharedWith.length,
    data: { sharedWith: resource.sharedWith }
  });
});

exports.getResourcesSharedWithUser = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const files = await File.find({ 'sharedWith.user': userId });
  const folders = await Folder.find({ 'sharedWith.user': userId });

  res.status(200).json({
    status: 'success',
    data: {
      files,
      folders
    }
  });
});

const recursivelyShareFolder = async (folderId, targetUser, permission) => {
  const subfolders = await Folder.find({ parent: folderId });
  const files = await File.find({ folder: folderId });

  const updateShare = async (doc) => {
    const alreadyShared = doc.sharedWith.find((entry) => entry.user?.equals(targetUser._id));
    if (alreadyShared) {
      alreadyShared.permission = permission;
    } else {
      doc.sharedWith.push({
        email: targetUser.email,
        user: targetUser._id,
        permission
      });
    }
    await doc.save();
  };

  for (const file of files) await updateShare(file);
  for (const folder of subfolders) {
    await updateShare(folder);
    await recursivelyShareFolder(folder._id, targetUser, permission);
  }
};

const recursivelyUnshareFolder = async (folderId, userId) => {
  const subfolders = await Folder.find({ parent: folderId });
  const files = await File.find({ folder: folderId });

  const removeUser = async (doc) => {
    doc.sharedWith = doc.sharedWith.filter(
      (entry) => !entry.user?.equals(userId)
    );
    await doc.save();
  };

  for (const file of files) await removeUser(file);
  for (const folder of subfolders) {
    await removeUser(folder);
    await recursivelyUnshareFolder(folder._id, userId);
  }
};
