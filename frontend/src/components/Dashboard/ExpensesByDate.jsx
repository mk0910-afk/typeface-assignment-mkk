import React, { useEffect, useMemo, useState } from 'react';
import CustomeLineChart from '../Charts/CustomeLineChart';
import moment from 'moment';

const ExpensesByDate = ({ data }) => {
    const [chartData, setChartData] = useState([]);

    const prepared = useMemo(() => {
        const sorted = [...(data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
        return sorted.map((item) => ({
            month: moment(item?.date).format('Do MMM'),
            amount: Number(item?.amount) || 0,
            category: item?.category,
        }));
    }, [data]);

    useEffect(() => {
        setChartData(prepared);
        return () => {};
    }, [prepared]);

    return (
        <div className="card col-span-1">
            <div className="flex items-center justify-between">
                <h5 className="text-lg">Expenses by Date</h5>
            </div>
            <CustomeLineChart data={chartData} />
        </div>
    );
};

export default ExpensesByDate;



