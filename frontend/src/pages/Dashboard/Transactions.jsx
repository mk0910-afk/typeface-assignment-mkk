import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import useUserAuth from '../../hooks/useUserAuth';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const Transactions = () => {
    useUserAuth();
    const [income, setIncome] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchAll = async () => {
        const [i, e] = await Promise.all([
            axiosInstance.get(API_PATHS.INCOME.GET_ALL_INCOME),
            axiosInstance.get(API_PATHS.EXPENSE.GET_ALL_EXPENSES),
        ]);
        setIncome(i.data || []);
        setExpenses(e.data || []);
    };

    useEffect(() => { fetchAll(); }, []);

    const merged = useMemo(() => {
        const mappedIncome = (income || []).map(x => ({
            _id: x._id,
            type: 'Income',
            label: x.source,
            amount: x.amount,
            date: x.date,
        }));
        const mappedExpenses = (expenses || []).map(x => ({
            _id: x._id,
            type: 'Expense',
            label: x.category,
            amount: x.amount,
            date: x.date,
        }));
        return [...mappedIncome, ...mappedExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [income, expenses]);

    const filteredMerged = useMemo(() => {
        if (!fromDate && !toDate) return merged;
        return merged.filter(tx => {
            const txDate = new Date(tx.date);
            const from = fromDate ? new Date(fromDate) : null;
            const to = toDate ? new Date(toDate) : null;
            if (from && txDate < from) return false;
            if (to && txDate > to) return false;
            return true;
        });
    }, [merged, fromDate, toDate]);

    const handlePdfUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        try {
            await axiosInstance.post(API_PATHS.TRANSACTIONS.PARSE_PDF, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            await fetchAll();
        } catch (e) {
            console.error('Failed to parse transactions PDF', e);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (row) => {
        try {
            if (row.type === 'Income') {
                await axiosInstance.delete(API_PATHS.INCOME.DELETE_INCOME(row._id));
            } else {
                await axiosInstance.delete(API_PATHS.EXPENSE.DELETE_EXPENSE(row._id));
            }
            await fetchAll();
        } catch (e) {
            console.error('Failed to delete transaction', e);
        }
    };

    return (
        <DashboardLayout activeMenu="Transactions">
            <div className="my-5 mx-auto">
                <div className="card mb-6">
                    <div className="flex items-center justify-between">
                        <h5 className="text-lg">Upload Transactions PDF</h5>
                    </div>
                    <input type="file" accept="application/pdf" className="mt-3" onChange={(e) => {
                        const f = e.target.files && e.target.files[0];
                        if (f) handlePdfUpload(f);
                    }} />
                    {uploading && <p className="text-sm mt-2">Parsing...</p>}
                </div>

                <div className="card mb-6">
                    <div className="flex items-center gap-4">
                        <label>
                            From: <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                        </label>
                        <label>
                            To: <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                        </label>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <h5 className="text-lg">All Transactions</h5>
                    </div>
                    <div className="mt-4 overflow-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr>
                                    <th className="py-2 pr-4">Date</th>
                                    <th className="py-2 pr-4">Type</th>
                                    <th className="py-2 pr-4">Label</th>
                                    <th className="py-2 pr-4">Amount</th>
                                    <th className="py-2 pr-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMerged.map((row) => (
                                    <tr key={`${row.type}-${row._id}`} className="border-t">
                                        <td className="py-2 pr-4">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="py-2 pr-4">{row.type}</td>
                                        <td className="py-2 pr-4">{row.label}</td>
                                        <td className="py-2 pr-4">${row.amount}</td>
                                        <td className="py-2 pr-4">
                                            <button
                                                className="text-red-600 underline"
                                                onClick={() => handleDelete(row)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Transactions;


