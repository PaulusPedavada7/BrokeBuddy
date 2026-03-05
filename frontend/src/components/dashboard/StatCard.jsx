export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 p-5 shadow-sm flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
        {label}
      </span>
      <span
        className={`text-2xl font-bold ${accent ?? "text-gray-900 dark:text-white"}`}
      >
        {value}
      </span>
      {sub && (
        <span className="text-xs text-gray-400 dark:text-zinc-500">{sub}</span>
      )}
    </div>
  );
}
