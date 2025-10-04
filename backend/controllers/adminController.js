const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const User = require('../models/userModel');
const File = require('../models/fileModel');
const Folder = require('../models/folderModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const queryObj = {};
  
  if (req.query.role) {
    queryObj.role = req.query.role;
  }

  if (req.query.active === 'false') {
    queryObj.active = false;
  } else {
    queryObj.active = true;
  }

  if (req.query.search) {
    queryObj.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;

  let sort = '-createdAt';
  if (req.query.sort) {
    sort = req.query.sort.split(',').join(' ');
  }

  const users = await User.find(queryObj)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-__v -passwordChangedAt');

  const total = await User.countDocuments(queryObj);

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { users }
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-passwordChangedAt -__v');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  if(user.active===false){
    return next(new AppError('This user is inactive',404));
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));

  const userFiles = await File.find({ user: user._id });
  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  for (const file of userFiles) {
    if (file.fileId) {
      await db.collection('uploads.files').deleteOne({ _id: file.fileId });
      await db.collection('uploads.chunks').deleteMany({ files_id: file.fileId });
    }
  }

  await File.deleteMany({ user: user._id });
  await Folder.deleteMany({ user: user._id });
  await User.findByIdAndDelete(user._id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const allowedFields = ['name', 'role', 'active'];
  const updates = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});



