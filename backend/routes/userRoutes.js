const express = require('express');
const authController = require('./../controllers/authController');
const shareController = require('./../controllers/shareController');
const statsController = require('./../controllers/statsController');
const zipController = require('./../controllers/zipController');
const adminController = require('./../controllers/adminController');
const userController = require('./../controllers/userController');

const router = express.Router();

router.post('/signup',authController.signup);
router.post('/login',authController.login);
router.post('/forgotPassword',authController.forgotPassword);
router.patch('/resetPassword/:token',authController.resetPassword);

router.get('/logout',authController.protect,authController.logout);
router.patch('/updateMyPassword',authController.protect,authController.updatePassword);
router.patch('/updateMe',authController.protect,userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router.get('/shared-with-me', authController.protect, shareController.getResourcesSharedWithUser);

router.get('/my-storage-stats',authController.protect,statsController.getStorageStats);

router.get(
  '/download-file-zip/:id',
  authController.protect,
  zipController.downloadFileAsZip
);
router.get(
  '/download-folder-zip/:id',
  authController.protect,
  zipController.downloadFolderAsZip
);

router.get('/recent-files', authController.protect, statsController.getRecentFiles);

router.get('/',authController.protect,authController.restrictTo('admin'),adminController.getAllUsers);
router.get('/:id',authController.protect,authController.restrictTo('admin'),adminController.getUser);
router.delete('/:id',authController.protect,authController.restrictTo('admin'),adminController.deleteUser);
router.patch('/:id',authController.protect,authController.restrictTo('admin'),adminController.updateUser);



module.exports = router;