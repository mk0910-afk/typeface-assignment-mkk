import React, { useEffect, useMemo, useState } from 'react';
import CustomPieChart from '../Charts/CustomPieChart';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const COLORS = ["#875CF5", "#FA2C37", "#FF6400", "#00C49F", "#CFBEFB", "#FFBB28", "#FF8042"]; 

const ExpensesByCategory = ({ data, allTime = false }) => {
    const [pieData, setPieData] = useState([]);
    const [loading, setLoading] = useState(false);

    const aggregated = useMemo(() => {
        const totalsByCategory = {};
        (data || []).forEach((item) => {
            const category = item?.category || 'Uncategorized';
            const amount = Number(item?.amount) || 0;
            totalsByCategory[category] = (totalsByCategory[category] || 0) + amount;
        });
        return Object.entries(totalsByCategory).map(([name, amount]) => ({ name, amount }));
    }, [data]);

    useEffect(() => {
        const run = async () => {
            if (allTime) {
                if (loading) return;
                setLoading(true);
                try {
                    const res = await axiosInstance.get(`${API_PATHS.EXPENSE.GET_ALL_EXPENSES}`);
                    const list = Array.isArray(res.data) ? res.data : [];
                    const totalsByCategory = {};
                    list.forEach((item) => {
                        const category = item?.category || 'Uncategorized';
                        const amount = Number(item?.amount) || 0;
                        totalsByCategory[category] = (totalsByCategory[category] || 0) + amount;
                    });
                    const aggregatedAll = Object.entries(totalsByCategory).map(([name, amount]) => ({ name, amount }));
                    setPieData(aggregatedAll);
                } catch (e) {
                    setPieData([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setPieData(aggregated);
            }
        };
        run();
        return () => {};
    }, [aggregated, allTime, loading]);

    const totalAmount = pieData.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    return (
        <div className="card col-span-1">
            <div className="flex items-center justify-between">
                <h5 className="text-lg">Expenses by Category</h5>
            </div>
            <CustomPieChart
                data={pieData}
                label="Total"
                totalAmount={`INR ${totalAmount}`}
                colors={COLORS}
                showTextAnchor
            />
        </div>
    );
};

export default ExpensesByCategory;


