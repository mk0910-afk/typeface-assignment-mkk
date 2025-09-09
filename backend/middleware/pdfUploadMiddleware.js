const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    return cb(new Error('Only PDF files are allowed'), false);
};

module.exports = multer({ storage, fileFilter });


