import { useState } from "react";
import { CATEGORY_CONFIG, FREQUENCIES } from "../../constants.js";
import { buildNextDue, formatNextDue } from "../../utils/recurringUtils.js";
import api from "../../axios.jsx";

export function EditRecurringModal({ r, onClose, onUpdate }) {
  const [description, setDescription] = useState(r.description);
  const [amount, setAmount] = useState(r.amount.toString());
  const [category, setCategory] = useState(r.category);
  const [frequency, setFrequency] = useState(r.frequency);
  const [dueDay, setDueDay] = useState(r.dueDay.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const day = parseInt(dueDay, 10);
    if (day < 1 || day > 31) {
      setError("Please enter a valid day between 1 and 31.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.patch(`/updaterecurringtransaction/${r.id}`, {
        description,
        amount: parseFloat(amount),
        category,
        frequency,
        date: day,
      });
      onUpdate(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 w-full max-w-md pointer-events-auto">
          <h2 className="text-xl font-semibold dark:text-white mb-4">
            Edit Recurring Transaction
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Description (e.g. Netflix, Rent)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
              required
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 dark:text-gray-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
                required
              >
                {Object.entries(CATEGORY_CONFIG)
                  .filter(([key]) => key !== "deposit")
                  .map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 dark:text-gray-400">Frequency</label>
              <div className="flex gap-2">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize border transition-colors ${
                      frequency === f
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 dark:text-gray-400">Due Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
                required
              />
              {dueDay && (
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                  Next due: {formatNextDue(buildNextDue(dueDay))}
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg border dark:text-white dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
