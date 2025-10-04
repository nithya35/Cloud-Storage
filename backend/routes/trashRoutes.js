const express = require('express');
const authController = require('../controllers/authController');
const trashController = require('../controllers/trashController');
const router = express.Router();

router.use(authController.protect);

router.delete('/empty', trashController.emptyAllTrash);

module.exports = router;