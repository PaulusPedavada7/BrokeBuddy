import { useState, useEffect } from "react";
import {
  buildNextDue,
  formatNextDue,
  deriveIsPaid,
  advanceToNextMonth,
} from "../../utils/recurringUtils.js";
import api from "../../axios.jsx";
import { DeleteRecurring } from "../modals/DeleteRecurring.jsx";
import { EditRecurringModal } from "../modals/EditRecurringModal.jsx";
import {
  CATEGORY_CONFIG,
  CATEGORY_BADGE,
  FREQ_BADGE,
} from "../../constants.js";

function daysUntil(dateStr) {
  const due = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function DueLabel({ days, isPaid, nextDue }) {
  const dateLabel = new Date(nextDue + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );

  if (isPaid)
    return (
      <span className="text-xs text-green-600 dark:text-green-400">
        Paid ✓ · next {dateLabel}
      </span>
    );

  if (days < 0)
    return (
      <span className="text-xs text-red-600 dark:text-red-400">
        Overdue by {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""}
      </span>
    );

  if (days === 0)
    return (
      <span className="text-xs text-red-500 dark:text-red-400">Due today</span>
    );

  const color =
    days <= 3
      ? "text-red-400 dark:text-red-300"
      : days <= 10
        ? "text-amber-500 dark:text-amber-400"
        : "text-gray-400 dark:text-zinc-500";

  return (
    <span className={`text-xs ${color}`}>
      Due in {days} day{days !== 1 ? "s" : ""} · {dateLabel}
    </span>
  );
}

function StatusDot({ days, isPaid }) {
  const color = isPaid
    ? "bg-green-400"
    : days < 0
      ? "bg-red-500"
      : days <= 3
        ? "bg-red-400"
        : days <= 10
          ? "bg-amber-400"
          : "bg-gray-300 dark:bg-zinc-500";
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />;
}

export function RecurringRow({ r, onDelete, onUpdate }) {
  const [nextDue, setNextDue] = useState(r.nextDue);
  const isPaid = deriveIsPaid(nextDue, r.dueDay);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    setNextDue(r.nextDue);
  }, [r.nextDue]);

  const days = daysUntil(nextDue);

  async function handleTogglePaid() {
    setLoading(true);
    const newNextDue = isPaid
      ? formatNextDue(buildNextDue(r.dueDay, true))
      : formatNextDue(advanceToNextMonth(r.dueDay));
    try {
      await api.patch(`/updaterecurringnextdue/${r.id}`, { nextDue: newNextDue });
      setNextDue(newNextDue);
      onUpdate?.({ ...r, nextDue: newNextDue });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-zinc-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-zinc-700/40 transition-colors">
      <StatusDot days={days} isPaid={isPaid} />

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
          {r.description}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded-full capitalize ${FREQ_BADGE[r.frequency]}`}
          >
            {r.frequency}
          </span>
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${CATEGORY_BADGE[r.category] ?? "bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300"}`}
          >
            {CATEGORY_CONFIG[r.category]?.label ?? r.category}
          </span>
        </div>
      </div>

      {/* Amount + due */}
      <div className="text-right shrink-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          ${r.amount.toFixed(2)}
        </p>
        <DueLabel days={days} isPaid={isPaid} nextDue={nextDue} />
      </div>

      {/* Mark paid */}
      <button
        onClick={handleTogglePaid}
        disabled={loading}
        className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          isPaid
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
            : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700"
        }`}
      >
        {loading ? "..." : isPaid ? "Paid ✓" : "Mark paid"}
      </button>

      {/* Edit */}
      <button
        onClick={() => setShowEditModal(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
        </svg>
      </button>

      {/* Delete */}
      <button
        onClick={() => setShowDeleteModal(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      {showDeleteModal && (
        <DeleteRecurring
          id={r.id}
          description={r.description}
          onDelete={onDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
      {showEditModal && (
        <EditRecurringModal
          r={{ ...r, nextDue }}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updated) => {
            onUpdate?.(updated);
            setNextDue(updated.nextDue);
          }}
        />
      )}
    </div>
  );
}
