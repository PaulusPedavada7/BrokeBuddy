import { useContext, useState } from "react";
import { UserContext } from "../../App.jsx";
import Sidebar from "../layout/Sidebar.jsx";
import AddExpense from "../modals/AddExpense.jsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CATEGORY_CONFIG, CATEGORY_BADGE, MONTHS } from "../../constants.js";

import { useDashboard } from "./useDashboard.js";
import { StatCard } from "./StatCard.jsx";
import { CustomTooltip } from "./CustomToolTip.jsx";
import { RecurringRow } from "./RecurringRow.jsx";
import { BudgetCard } from "./BudgetCard.jsx";
import { AddRecurringModal } from "../modals/AddRecurringModal.jsx";

function Dashboard() {
  const { currentUser } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [spendingTimeFilter, setSpendingTimeFilter] = useState("30D");

  const {
    transactions,
    filtered,
    recurring,
    filterMode,
    setFilterMode,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    availableYears,
    total,
    totalDeposits,
    largest,
    categoryTotals,
    recent,
    monthlyRecurringTotal,
    filterLabel,
    refreshTransactions,
    addRecurring,
    deleteRecurring,
    updateRecurring,
    budgets,
    setBudget,
    deleteBudget,
    currentMonthSpending,
  } = useDashboard();

  const spendingOverTimeData = (() => {
    const withdrawals = transactions.filter((t) => t.amount < 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (spendingTimeFilter === "7D" || spendingTimeFilter === "30D") {
      const days = spendingTimeFilter === "7D" ? 7 : 30;
      return Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (days - 1 - i));
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const amount = withdrawals
          .filter((t) => t.date.slice(0, 10) === dateStr)
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        return { label: `${d.getMonth() + 1}/${d.getDate()}`, amount };
      });
    }

    if (spendingTimeFilter === "3M") {
      return Array.from({ length: 13 }, (_, i) => {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (12 - i) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const label = `${MONTHS[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()}`;
        const amount = withdrawals
          .filter((t) => {
            const d = new Date(t.date.slice(0, 10) + "T00:00:00");
            return d >= weekStart && d <= weekEnd;
          })
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        return { label, amount };
      });
    }

    let numMonths;
    if (spendingTimeFilter === "6M") numMonths = 6;
    else if (spendingTimeFilter === "1Y") numMonths = 12;
    else {
      if (withdrawals.length === 0) return [];
      const earliest = withdrawals
        .map((t) => new Date(t.date.slice(0, 10) + "T00:00:00"))
        .reduce((min, d) => (d < min ? d : min), new Date());
      numMonths =
        (today.getFullYear() - earliest.getFullYear()) * 12 +
        (today.getMonth() - earliest.getMonth()) +
        1;
    }

    return Array.from({ length: numMonths }, (_, i) => {
      const d = new Date(
        today.getFullYear(),
        today.getMonth() - (numMonths - 1 - i),
        1,
      );
      const label = `${MONTHS[d.getMonth()].slice(0, 3)} '${String(d.getFullYear()).slice(2)}`;
      const amount = withdrawals
        .filter((t) => {
          const td = new Date(t.date.slice(0, 10) + "T00:00:00");
          return (
            td.getMonth() === d.getMonth() &&
            td.getFullYear() === d.getFullYear()
          );
        })
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      return { label, amount };
    });
  })();

  function handleAddClose() {
    setShowModal(false);
    refreshTransactions();
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-zinc-900">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <main className="flex-1 px-8 py-8 max-w-6xl w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Hello, {currentUser?.first_name} 👋
              </h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                Here's your financial snapshot
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-sm font-medium transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Transaction
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="flex gap-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-1">
              {["month", "year", "all"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterMode === mode
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {mode === "all"
                    ? "All Time"
                    : mode === "month"
                      ? "By Month"
                      : "By Year"}
                </button>
              ))}
            </div>

            {(filterMode === "month" || filterMode === "year") && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}

            {filterMode === "month" && (
              <div className="flex gap-1 flex-wrap">
                {MONTHS.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMonth(i)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedMonth === i
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">
              {filterLabel} · {filtered.length} transaction
              {filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Total Spent"
              value={`-$${Math.abs(total).toFixed(2)}`}
              sub={filterLabel}
              accent="text-red-500"
            />
            <StatCard
              label="Total Deposits"
              value={`$${totalDeposits.toFixed(2)}`}
              sub={filterLabel}
              accent="text-green-500"
            />
            <StatCard
              label="Income vs Expenses"
              value={`${totalDeposits - Math.abs(total) >= 0 ? "+" : "-"}$${Math.abs(totalDeposits - Math.abs(total)).toFixed(2)}`}
              sub={totalDeposits - Math.abs(total) >= 0 ? "Surplus" : "Deficit"}
              accent={totalDeposits - Math.abs(total) >= 0 ? "text-green-500" : "text-red-500"}
            />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-4">
                Spending by Category · {filterLabel}
              </h2>
              {categoryTotals.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-300 dark:text-zinc-600 text-sm">
                  No data yet
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryTotals}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryTotals.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex flex-col gap-2">
                    {categoryTotals.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="text-gray-600 dark:text-zinc-300">
                            {c.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 dark:text-zinc-500">
                            {c.percent}%
                          </span>
                          <span className="font-semibold text-gray-800 dark:text-white">
                            ${c.value.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Recent transactions */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-4">
                Recent Transactions
              </h2>
              {recent.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-300 dark:text-zinc-600 text-sm">
                  No transactions yet
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-zinc-700">
                  {recent.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_CONFIG[t.category]?.color ?? "#94a3b8",
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {t.description}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">
                            {new Date(t.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              timeZone: "UTC",
                            })}
                            {" · "}
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-xs ${CATEGORY_BADGE[t.category] ?? ""}`}
                            >
                              {CATEGORY_CONFIG[t.category]?.label ?? t.category}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          t.amount < 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {t.amount < 0
                          ? `-$${Math.abs(t.amount).toFixed(2)}`
                          : `$${t.amount.toFixed(2)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Budget targets */}
            <BudgetCard
              budgets={budgets}
              currentMonthSpending={currentMonthSpending}
              onSave={setBudget}
              onDelete={deleteBudget}
            />

            {/* Recurring transactions */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Recurring Transactions
                  </h2>
                  {recurring.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      ~${monthlyRecurringTotal.toFixed(2)} / month
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowRecurringModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-xs font-medium transition-colors"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Recurring
                </button>
              </div>

              {recurring.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300 dark:text-zinc-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 mb-2 opacity-40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <p className="text-sm">No recurring transactions yet</p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-700 overflow-hidden">
                  {[...recurring].map((r) => (
                    <RecurringRow
                      key={r.id}
                      r={r}
                      onDelete={deleteRecurring}
                      onUpdate={updateRecurring}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Spending Over Time */}
          <div className="mt-6 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                Spending Over Time
              </h2>
              <div className="flex gap-1 bg-gray-100 dark:bg-zinc-700 rounded-lg p-1">
                {["7D", "30D", "3M", "6M", "1Y", "All"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSpendingTimeFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      spendingTimeFilter === f
                        ? "bg-white dark:bg-zinc-600 text-gray-800 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {spendingOverTimeData.length === 0 ||
            spendingOverTimeData.every((d) => d.amount === 0) ? (
              <div className="flex items-center justify-center h-48 text-gray-300 dark:text-zinc-600 text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={spendingOverTimeData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="spendingGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toFixed(2)}`,
                      "Spent",
                    ]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#spendingGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#3b82f6" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </main>
      </div>

      {showModal && <AddExpense onClose={handleAddClose} />}
      {showRecurringModal && (
        <AddRecurringModal
          onClose={() => setShowRecurringModal(false)}
          onAdd={addRecurring}
        />
      )}
    </div>
  );
}

export default Dashboard;
