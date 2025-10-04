const express = require('express');
const folderController = require('../controllers/folderController');
const authController = require('../controllers/authController');
const trashController = require('../controllers/trashController');
const shareController = require('../controllers/shareController');

const router = express.Router();

router.use(authController.protect);

router.post('/', folderController.createFolder);
router.get('/', folderController.getFolders);
router.get('/trash',folderController.listTrashedFolders);
router.patch('/rename/:id', folderController.renameFolder);
router.patch('/move/:id', folderController.moveFolder);
router.delete('/delete/:id', folderController.trashFolder);
router.patch('/restore/:id', trashController.restoreFolder);
router.delete('/deletepermanent/:id', trashController.deleteFolderPermanently); 

router.post('/share/:id', (req, res, next) => {
  req.params.type = 'folder';
  next();
}, shareController.shareResource);

router.delete('/unshare/:id', (req, res, next) => {
  req.params.type = 'folder';
  next();
}, shareController.unshareResource);

router.get('/share/:id', (req, res, next) => {
  req.params.type = 'folder';
  next();
}, shareController.getSharedUsers);

module.exports = router;
