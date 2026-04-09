import { useState } from "react";
import { CATEGORY_CONFIG } from "../../constants.js";
import { SetBudgetModal } from "../modals/SetBudgetModal.jsx";

export function BudgetCard({ budgets, currentMonthSpending, onSave, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  function handleEdit(category) {
    setEditingCategory(category);
    setShowModal(true);
  }

  function handleAdd() {
    setEditingCategory(null);
    setShowModal(true);
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
          Monthly Budgets
        </h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-xs font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Set Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-gray-300 dark:text-zinc-600 text-sm">
          No budgets set yet
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {budgets.map((b) => {
            const spent = currentMonthSpending[b.category] ?? 0;
            const percent = Math.min((spent / b.amount) * 100, 100);
            const over = spent > b.amount;
            const warn = !over && percent >= 75;
            const barColor = over ? "bg-red-500" : warn ? "bg-amber-400" : "bg-green-500";
            const textColor = over
              ? "text-red-500"
              : warn
                ? "text-amber-500"
                : "text-green-600 dark:text-green-400";
            const { label, color } = CATEGORY_CONFIG[b.category] ?? { label: b.category, color: "#94a3b8" };

            return (
              <div key={b.category} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-200">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${textColor}`}>
                      ${spent.toFixed(2)} / ${b.amount.toFixed(2)}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => handleEdit(b.category)}
                        className="text-xs text-gray-400 hover:text-blue-500 px-1 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(b.category)}
                        className="text-xs text-gray-400 hover:text-red-500 px-1 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {over && (
                  <p className="text-xs text-red-500 mt-1">
                    Over budget by ${(spent - b.amount).toFixed(2)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <SetBudgetModal
          onClose={() => setShowModal(false)}
          onSave={onSave}
          editCategory={editingCategory}
          existing={editingCategory ? budgets.find((b) => b.category === editingCategory) : null}
        />
      )}
    </div>
  );
}
