import React, { useState } from 'react'
import Input from '../Inputs/Input'
import EmojiPickerPopup from '../EmojiPickerPopup'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'

const AddExpenseForm = ({ onAddExpense }) => {
    const [expense, setExpense] = useState({
        category: "",
        amount: "",
        date: "",
        icon: "",
    });
    const [autoAddFromReceipt, setAutoAddFromReceipt] = useState(false);

    const handleChange = (key, value) => setExpense({ ...expense, [key]: value });
  return (
    <div>
      <div className="mt-4">
        <label className="text-sm font-medium text-gray-700">Upload Receipt (Image/PDF)</label>
        <input
          type="file"
          accept="image/*,application/pdf,image/heic"
          className="mt-2"
          onChange={async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('receipt', file);
            try {
              const res = await axiosInstance.post(`${API_PATHS.EXPENSE.PARSE_RECEIPT}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              const { amount, dateISO, category } = res.data || {};
              const updated = (prev => ({
                ...prev,
                amount: amount !== undefined && amount !== null ? String(amount) : prev.amount,
                date: dateISO || prev.date,
                category: category || prev.category,
              }))(expense);
              setExpense(updated);
              if (autoAddFromReceipt) {
                onAddExpense(updated);
              }
            } catch (err) {
              console.error('Failed to parse receipt', err);
            }
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          id="auto-add-receipt"
          type="checkbox"
          checked={autoAddFromReceipt}
          onChange={(e) => setAutoAddFromReceipt(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <label htmlFor="auto-add-receipt" className="text-sm text-gray-700">Auto-add after receipt parse</label>
      </div>
        <EmojiPickerPopup
        icon={expense.icon}
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />

      <Input
        value={expense.category}
        onChange={({ target }) => handleChange("category", target.value)}
        label="Category"
        placeholder="Food, Entertainment etc."
        type="text"
      />

      <Input
        value={expense.amount}
        onChange={({ target }) => handleChange("amount", target.value)}
        label="Amount"
        placeholder="INR 1000"
        type="number"
      />

      <Input
        value={expense.date}
        onChange={({ target }) => handleChange("date", target.value)}
        label="Date"
        placeholder="DD/MM/YYYY"
        type="date"
      />

      <div className="flex justify-end mt-6">
        <button 
          type="button"
          className="add-btn add-btn-fill"
          onClick={() => onAddExpense(expense)}
        >
            Add Expense
        </button>
      </div>
    </div>
  )
}

export default AddExpenseForm