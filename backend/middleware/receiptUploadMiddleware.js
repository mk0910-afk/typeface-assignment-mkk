const multer = require('multer');

// Configure multer storage for receipts
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

// Allow images and PDFs for receipt parsing
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, HEIC, and PDF are allowed.'), false);
    }
};

const receiptUpload = multer({ storage, fileFilter });

module.exports = receiptUpload;


