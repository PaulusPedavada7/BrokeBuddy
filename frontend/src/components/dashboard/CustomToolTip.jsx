export function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { name, value, payload: p } = payload[0];
    return (
      <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-2 shadow-lg text-sm">
        <p className="font-semibold text-gray-800 dark:text-white">{name}</p>
        <p className="text-gray-500 dark:text-zinc-400">
          ${value.toFixed(2)} · {p.percent}%
        </p>
      </div>
    );
  }
  return null;
}
