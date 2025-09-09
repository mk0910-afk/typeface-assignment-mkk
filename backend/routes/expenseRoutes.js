const express = require('express');
const {
    addExpense,
    getAllExpense,
    deleteExpense,
    downloadExpenseExcel,
    parseReceipt,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");
const receiptUpload = require("../middleware/receiptUploadMiddleware");

const router = express.Router();

router.post("/add", protect, addExpense);
router.get("/get", protect, getAllExpense);
router.get("/downloadexcel", protect, downloadExpenseExcel);
router.delete("/:id", protect, deleteExpense);
router.post('/parse-receipt', protect, receiptUpload.single('receipt'), parseReceipt);


module.exports = router;