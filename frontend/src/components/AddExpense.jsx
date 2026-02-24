import React, { useEffect, useState } from "react";
import api from '../axios.jsx';

function AddExpense({ onClose }) {

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  async function handleSubmit(e) {
      e.preventDefault();
      try {
          const res = await api.post("/addtransaction", {
              amount: parseFloat(amount),
              category: category,
              description: description,
              date: new Date(date).toISOString()
          });
          console.log(res.data.message);
          onClose(); // closes the modal on success
      } catch (error) {
          console.error(error?.response?.data?.detail || error.message);
      }
  }

  return (
    <>
      {/* Gray overlay background */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose} // clicking outside closes the modal
      />

      {/* Modal box */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 w-full max-w-md pointer-events-auto">
          <h2 className="text-xl font-semibold dark:text-white mb-4">Add Expense</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
            />

            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
            />

            <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500 dark:text-gray-400">Category</label>
                <select
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                    <option value="">Select a category</option>
                    <option value="food">Dining</option>
                    <option value="transport">Travel</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="utilities">Utilities</option>
                </select>
            </div>
            
            <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500 dark:text-gray-400">Date of Expense</label>
                <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
                />
            </div>         

            <div className="flex justify-end gap-2">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border dark:text-white dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddExpense;