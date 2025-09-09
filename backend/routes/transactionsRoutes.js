const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/pdfUploadMiddleware');
const { parseTransactionsPdf } = require('../controllers/transactionsController');

const router = express.Router();

router.post('/parse-pdf', protect, upload.single('file'), parseTransactionsPdf);

module.exports = router;


