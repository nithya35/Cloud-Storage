const express = require('express');
const fileController = require('../controllers/fileController');
const authController = require('../controllers/authController');
const trashController = require('../controllers/trashController');
const shareController = require('../controllers/shareController');
const upload = require('../utils/gridFsStorage');

const router = express.Router();

router.use(authController.protect);

router.post('/upload',upload.single('file'), fileController.uploadFile);
router.get('/preview/:id', fileController.previewFile);
router.get('/download/:id', fileController.downloadFile); 
router.get('/', fileController.listFiles);
router.get('/trash',fileController.listTrashedFiles);
router.patch('/rename/:id', fileController.renameFile);
router.patch('/move/:id', fileController.moveFile);
router.delete('/delete/:id', fileController.deleteFile);
router.patch('/restore/:id', trashController.restoreFile);
router.delete('/deletepermanent/:id', trashController.deleteFilePermanently);

router.post('/share/:id', (req, res, next) => {
  req.params.type = 'file';
  next();
}, shareController.shareResource);

router.delete('/unshare/:id', (req, res, next) => {
  req.params.type = 'file';
  next();
}, shareController.unshareResource);

router.get('/share/:id', (req, res, next) => {
  req.params.type = 'file';
  next();
}, shareController.getSharedUsers);


module.exports = router;
