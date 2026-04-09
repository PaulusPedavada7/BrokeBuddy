import { useState } from "react";
import { CATEGORY_CONFIG } from "../../constants.js";

export function SetBudgetModal({ onClose, onSave, editCategory, existing }) {
  const [category, setCategory] = useState(editCategory ?? "");
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!editCategory;

  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave(category, parsed);
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
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 w-full max-w-sm pointer-events-auto">
          <h2 className="text-xl font-semibold dark:text-white mb-4">
            {isEditing ? "Edit Budget" : "Set Budget"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 dark:text-gray-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isEditing}
                className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600 disabled:opacity-60"
                required
              >
                <option value="">Select a category</option>
                {Object.entries(CATEGORY_CONFIG)
                  .filter(([key]) => key !== "deposit")
                  .map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 dark:text-gray-400">Monthly limit ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
                required
              />
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
