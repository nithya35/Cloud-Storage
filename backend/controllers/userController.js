const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const File = require('../models/fileModel');
const Folder = require('../models/folderModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    return next(new AppError('This is not the route to change password.Use /updateMyPassword to change password.', 400));
  }

  const filteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) return next(new AppError('User not found', 404));

  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  const userFiles = await File.find({ user: userId });
  for (const file of userFiles) {
    if (file.fileId) {
      await db.collection('uploads.files').deleteOne({ _id: file.fileId });
      await db.collection('uploads.chunks').deleteMany({ files_id: file.fileId });
    }
  }

  await File.deleteMany({ user: userId });
  await Folder.deleteMany({ user: userId });
  await User.findByIdAndDelete(userId);

  res.status(204).json({
    status: 'success',
    message: 'Account and data deleted'
  });
});
