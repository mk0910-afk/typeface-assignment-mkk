const XLSX = require("xlsx");
const Expense = require("../models/Expense");
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
const heicConvert = require('heic-convert');
const moment = require('moment');

// Add expense
exports.addExpense = async (req, res) => {
    const userId = req.user.id;

    try {
        const { icon, category, amount, date } = req.body

        // Validation: Check for missing fields
        if (!category || !amount || !date) {
            return res.status(400).json({ message: "All fields are required " });
        }

        const newExpense = new Expense({
            userId,
            icon,
            category,
            amount,
            date: new Date(date)
        });

        await newExpense.save();
        res.status(200).json(newExpense);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all expenses (optionally filtered by start and end date via query params)
exports.getAllExpense = async (req, res) => {
    const userId = req.user.id;

    try {
        const { startDate, endDate } = req.query;

        const query = { userId };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                if (!isNaN(start.getTime())) {
                    query.date.$gte = start;
                }
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!isNaN(end.getTime())) {
                    // use exclusive upper bound to avoid timezone issues (end of day + 1ms)
                    const nextDay = new Date(end.getTime());
                    nextDay.setDate(nextDay.getDate() + 1);
                    nextDay.setHours(0, 0, 0, 0);
                    query.date.$lt = nextDay;
                }
            }

            // Remove empty date filter if neither valid
            if (Object.keys(query.date).length === 0) {
                delete query.date;
            }
        }

        const expense = await Expense.find(query).sort({ date: -1 });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }

};

// Delete expense source
exports.deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: "Expense source deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Download Excel of expense
exports.downloadExpenseExcel = async (req, res) => {
    const userId = req.user.id;
    try {
        const expense = await Expense.find({ userId }).sort({ date: -1 });

        // Prepare data for Excel
        const data = expense.map((item) => ({
            Category: item.category,
            Amount: item.amount,
            Date: item.date,
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Expense");
        XLSX.writeFile(wb, "expense_details.xlsx");
        res.download("expense_details.xlsx");
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Parse uploaded receipt and extract expense details
exports.parseReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { mimetype, path: filePath, buffer } = req.file;

        let extractedText = '';

        if (mimetype === 'application/pdf') {
            const dataBuffer = buffer || require('fs').readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            extractedText = pdfData.text || '';
        } else {
            const fs = require('fs');
            const imageBuffer = buffer || fs.readFileSync(filePath);
            let ocrBuffer = imageBuffer;
            try {
                if (mimetype === 'image/heic' || /\.heic$/i.test(filePath)) {
                    ocrBuffer = await heicConvert({ buffer: imageBuffer, format: 'JPEG', quality: 1 });
                } else {
                    ocrBuffer = await sharp(imageBuffer).png().toBuffer();
                }
            } catch (e) {
                ocrBuffer = imageBuffer;
            }
            const { data: { text } } = await Tesseract.recognize(ocrBuffer, 'eng');
            extractedText = text || '';
        }

        // If OpenAI key is set, try GenAI extraction
        const openAiKey = process.env.OPENAI_API_KEY;
        let aiAmount = null;
        let aiDateISO = null;
        let aiCategory = null;
        if (openAiKey && extractedText) {
            try {
                const OpenAI = require("openai");
                const client = new OpenAI({ apiKey: openAiKey });
                const prompt = `Extract the following fields from this receipt text. Return strict JSON with keys amount (number), dateISO (YYYY-MM-DD), category (string).\nText:\n${extractedText}`;

                const completion = await client.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You extract structured data from noisy receipt text." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0
                });
                const content = completion.choices?.[0]?.message?.content || "";
                const jsonStart = content.indexOf("{");
                const jsonEnd = content.lastIndexOf("}");
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
                    if (parsed) {
                        if (parsed.amount != null) aiAmount = Number(parsed.amount);
                        if (parsed.dateISO && moment(parsed.dateISO, "YYYY-MM-DD", true).isValid()) aiDateISO = parsed.dateISO;
                        if (parsed.category) aiCategory = parsed.category;
                    }
                }
            } catch (e) {
                // Swallow AI errors and fallback to heuristics
            }
        }

        // Basic parsing heuristics as fallback or to fill missing fields
        const lines = extractedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const fullText = lines.join(' ');

        // Amount detection
        let amount = aiAmount;
        if (amount == null) {
            const amountPrimary = fullText.match(/(?:total\s*(?:due)?|amount\s*due|grand\s*total)[^\d$€£]*([$€£]?\s*\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)/i)
                || fullText.match(/([$€£]?\s*\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)\s*(?:total|amount\s*due)/i);
            if (amountPrimary && amountPrimary[1]) {
                amount = Number(amountPrimary[1].replace(/[^0-9.]/g, ''));
            }
            if (amount == null) {
                for (const line of lines) {
                    const m = line.match(/(?:total|balance\s*due|amount\s*due)\D*([$€£]?\s*\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)/i);
                    if (m && m[1]) { amount = Number(m[1].replace(/[^0-9.]/g, '')); break; }
                }
            }
            if (amount == null) {
                const allNums = (fullText.match(/\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?/g) || []).map(n => Number(n.replace(/[^0-9.]/g, '').replace(/[,\s]/g, '')));
                if (allNums.length) amount = Math.max(...allNums);
            }
        }

        // Date detection
        let dateISO = aiDateISO;
        if (!dateISO) {
            const dateRegexes = [
                /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
                /(\d{4}[\-]\d{1,2}[\-]\d{1,2})/,
                /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/,
                /(\d{1,2}[\/]\d{1,2}[\/]\d{2})/
            ];
            let dateStr = null;
            for (const rx of dateRegexes) {
                const m = fullText.match(rx);
                if (m && m[1]) { dateStr = m[1]; break; }
            }
            if (dateStr) {
                const formats = ['DD/MM/YYYY', 'D/M/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 'D-M-YYYY', 'DD/MM/YY', 'D/M/YY', 'DD MMM YYYY', 'D MMM YYYY', 'MM/DD/YYYY', 'M/D/YYYY', 'MM-DD-YYYY', 'M-D-YYYY'];
                let mo = moment(dateStr, formats, true);
                if (!mo.isValid()) mo = moment(dateStr);
                if (mo.isValid()) dateISO = mo.format('YYYY-MM-DD');
            }
        }

        // Category detection
        let category = aiCategory || 'Others';
        if (!aiCategory) {
            const categoryMap = [
                { key: /grocery|supermarket|market|mart|food|restaurant|cafe|eat|meal/i, category: 'Food' },
                { key: /fuel|gas|petrol|diesel|uber|transport|bus|train|taxi/i, category: 'Transport' },
                { key: /pharmacy|medical|clinic|health|medicine/i, category: 'Health' },
                { key: /clothes|apparel|fashion|shoe|mall|retail/i, category: 'Shopping' },
                { key: /utility|electric|water|internet|wifi|phone|bill/i, category: 'Utilities' },
            ];
            for (const c of categoryMap) {
                if (c.key.test(fullText)) { category = c.category; break; }
            }
        }

        return res.json({
            amount: amount != null ? Number(amount) : '',
            dateISO: dateISO || '',
            category,
            rawText: extractedText,
        });
    } catch (error) {
        console.error('Receipt parse error', error);
        return res.status(500).json({ message: 'Failed to parse receipt' });
    }
};