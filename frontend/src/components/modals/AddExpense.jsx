import React, { useEffect, useState } from "react";
import api from "../../axios.jsx";
import { CATEGORY_CONFIG } from "../../constants.js";

function AddExpense({ onClose }) {
  const [type, setType] = useState("withdrawal");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const parsedAmount = parseFloat(amount);
      const finalAmount =
        type === "withdrawal"
          ? -Math.abs(parsedAmount)
          : Math.abs(parsedAmount);

      const res = await api.post("/addtransaction", {
        amount: finalAmount,
        category,
        description,
        date: new Date(date).toISOString(),
      });
      console.log(res.data.message);
      onClose();
    } catch (error) {
      console.error(error?.response?.data?.detail || error.message);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 w-full max-w-md pointer-events-auto">
          <h2 className="text-xl font-semibold dark:text-white mb-4">
            Add Transaction
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Withdrawal / Deposit toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-600">
              <button
                type="button"
                onClick={() => {
                  setType("withdrawal");
                  setCategory("");
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  type === "withdrawal"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-600"
                }`}
              >
                Withdrawal
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("deposit");
                  setCategory("deposit");
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  type === "deposit"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-600"
                }`}
              >
                Deposit
              </button>
            </div>

            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
            />

            {/* Only show category selector for withdrawals */}
            {type === "withdrawal" && (
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
                  required
                >
                  <option value="">Select a category</option>
                  {Object.entries(CATEGORY_CONFIG)
                    .filter(([key]) => key !== "deposit")
                    .map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                Date
              </label>
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
