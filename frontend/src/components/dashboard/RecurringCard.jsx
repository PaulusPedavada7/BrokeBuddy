import {
  CATEGORY_CONFIG,
  CATEGORY_BADGE,
  FREQ_BADGE,
} from "../../constants.js";

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

export function RecurringCard({ r, onDelete }) {
  const days = daysUntil(r.nextDue);
  const isOverdue = days < 0;
  const isDueSoon = days >= 0 && days <= 3;

  return (
    <div className="relative group flex flex-col gap-2 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
      {/* Delete button */}
      <button
        onClick={() => onDelete(r.id)}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Top row */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            backgroundColor: CATEGORY_CONFIG[r.category]?.color ?? "#94a3b8",
          }}
        />
        <p className="text-sm font-medium text-gray-800 dark:text-white truncate pr-5">
          {r.description}
        </p>
      </div>

      {/* Amount */}
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        ${r.amount.toFixed(2)}
      </p>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${FREQ_BADGE[r.frequency]}`}
        >
          {r.frequency}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[r.category] ?? "bg-gray-100 text-gray-600"}`}
        >
          {CATEGORY_CONFIG[r.category]?.label ?? r.category}
        </span>
      </div>

      {/* Due date */}
      <p
        className={`text-xs font-medium mt-0.5 ${
          isOverdue
            ? "text-red-500"
            : isDueSoon
              ? "text-amber-500"
              : "text-gray-400 dark:text-zinc-500"
        }`}
      >
        {isOverdue
          ? `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`
          : days === 0
            ? "Due today"
            : `Due in ${days} day${days !== 1 ? "s" : ""} · ${new Date(r.nextDue).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
      </p>
    </div>
  );
}
