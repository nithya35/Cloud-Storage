const multer = require('multer');

const storage = multer.memoryStorage();
//store files temporarily in memory

module.exports = multer({ storage });
