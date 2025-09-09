const pdfParse = require('pdf-parse');
const moment = require('moment');
const Income = require('../models/Income');
const Expense = require('../models/Expense');

exports.parseTransactionsPdf = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const userId = req.user.id;
        const fs = require('fs');
        const dataBuffer = req.file.buffer || fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        const text = pdfData.text || '';

        let parsed = [];
        const openAiKey = process.env.OPENAI_API_KEY;
        if (openAiKey) {
            try {
                const OpenAI = require('openai');
                const client = new OpenAI({ apiKey: openAiKey });
                const prompt = `You will receive raw text extracted from a tabular bank statement/transactions PDF. Parse rows and return strict JSON array, where each item has: { type: "income"|"expense", category: string (for expenses) or source: string (for income), amount: number, dateISO: YYYY-MM-DD }. Ensure valid JSON only. Text:\n${text}`;
                const completion = await client.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'Extract structured transactions from tabular statements and return strict JSON without extra text.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0
                });
                const content = completion.choices?.[0]?.message?.content || '[]';
                const jsonStart = content.indexOf('[');
                const jsonEnd = content.lastIndexOf(']');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
                }
            } catch (e) {
                // fall through to regex parsing
            }
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
            // Fallback naive row parsing: match lines with date, description, amount
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const dateRx = /(\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/;
            for (const line of lines) {
                const dm = line.match(dateRx);
                const am = line.match(/(-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/);
                if (dm && am) {
                    const rawDate = dm[1];
                    const mo = moment(rawDate, ["YYYY-MM-DD","DD/MM/YYYY","D/M/YYYY","DD-MM-YYYY","D-M-YYYY","MM/DD/YYYY","M/D/YYYY"], true);
                    const dateISO = mo.isValid() ? mo.format('YYYY-MM-DD') : null;
                    const amount = Number(am[1].replace(/,/g, ''));
                    const rest = line.replace(dm[1], '').replace(am[1], '').trim();
                    const type = amount >= 0 ? 'income' : 'expense';
                    parsed.push({ type, source: type==='income'?rest:'', category: type==='expense'?rest:'', amount: Math.abs(amount), dateISO });
                }
            }
        }
        const created = [];

        for (const row of parsed) {
            const amount = Number(row.amount);
            const dateISO = row.dateISO && moment(row.dateISO, 'YYYY-MM-DD', true).isValid() ? row.dateISO : null;
            if (!amount || !dateISO) continue;

            if (String(row.type).toLowerCase() === 'income') {
                const doc = await Income.create({
                    userId,
                    source: row.source || 'Other',
                    amount,
                    date: new Date(dateISO),
                });
                created.push({ type: 'income', doc });
            } else {
                const doc = await Expense.create({
                    userId,
                    category: row.category || 'Others',
                    amount,
                    date: new Date(dateISO),
                });
                created.push({ type: 'expense', doc });
            }
        }

        return res.status(200).json({ inserted: created.length, items: created });
    } catch (err) {
        console.error('parseTransactionsPdf error', err);
        return res.status(500).json({ message: 'Failed to parse transactions PDF' });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, startDate, endDate } = req.query;
        const filter = { userId };
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }
        let results = [];
        if (type === 'income' || !type) {
            const incomes = await Income.find(filter).sort({ date: -1 });
            results = results.concat(incomes.map(i => ({ ...i.toObject(), type: 'income' })));
        }
        if (type === 'expense' || !type) {
            const expenses = await Expense.find(filter).sort({ date: -1 });
            results = results.concat(expenses.map(e => ({ ...e.toObject(), type: 'expense' })));
        }
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


