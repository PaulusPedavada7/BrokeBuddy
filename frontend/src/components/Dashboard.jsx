import React, { useEffect, useState, useContext } from "react";
import api from "../axios.jsx";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App.jsx";
import Sidebar from "./Sidebar.jsx";
import AddExpense from "./AddExpense.jsx";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  CATEGORY_CONFIG,
  CATEGORY_BADGE,
  MONTHS,
  FREQUENCIES,
  FREQ_BADGE,
} from "../constants.js";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
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

const CustomTooltip = ({ active, payload }) => {
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
};

// ─── Add Recurring Modal ──────────────────────────────────────────────────────

function AddRecurringModal({ onClose, onAdd }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDue, setNextDue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!description || !amount || !category || !nextDue) return;
    onAdd({
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      category,
      frequency,
      nextDue,
    });
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 w-full max-w-md pointer-events-auto">
          <h2 className="text-xl font-semibold dark:text-white mb-4">
            Add Recurring Transaction
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
                {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                Frequency
              </label>
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
              <label className="text-sm text-gray-500 dark:text-gray-400">
                Next Due Date
              </label>
              <input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
                required
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
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
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const { currentUser } = useContext(UserContext);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [filterMode, setFilterMode] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Recurring transactions stored in localStorage so they persist
  const [recurring, setRecurring] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recurring") ?? "[]");
    } catch {
      return [];
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/gettransactions").then((res) => setTransactions(res.data));
  }, []);

  useEffect(() => {
    localStorage.setItem("recurring", JSON.stringify(recurring));
  }, [recurring]);

  function handleAddClose() {
    setShowModal(false);
    api.get("/gettransactions").then((res) => setTransactions(res.data));
  }

  function handleAddRecurring(item) {
    setRecurring((prev) => [...prev, item]);
  }

  function handleDeleteRecurring(id) {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  }

  // Days until due
  function daysUntil(dateStr) {
    const diff = Math.ceil(
      (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  }

  // Available years
  const availableYears = [
    ...new Set(transactions.map((t) => new Date(t.date).getFullYear())),
  ].sort((a, b) => b - a);
  if (!availableYears.includes(selectedYear))
    availableYears.unshift(selectedYear);

  // Filter
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    if (filterMode === "month")
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    if (filterMode === "year") return d.getFullYear() === selectedYear;
    return true;
  });

  // Stats
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  const largest = filtered.reduce(
    (max, t) => (t.amount > (max?.amount ?? 0) ? t : max),
    null,
  );

  // Pie chart
  const categoryTotals = Object.entries(CATEGORY_CONFIG)
    .map(([key, { label, color }]) => {
      const value = filtered
        .filter((t) => t.category === key)
        .reduce((s, t) => s + t.amount, 0);
      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
      return { name: label, value, color, percent };
    })
    .filter((c) => c.value > 0);

  // Recent
  const recent = [...filtered]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Monthly recurring total
  const monthlyRecurringTotal = recurring.reduce((sum, r) => {
    if (r.frequency === "monthly") return sum + r.amount;
    if (r.frequency === "weekly") return sum + r.amount * 4.33;
    if (r.frequency === "yearly") return sum + r.amount / 12;
    return sum;
  }, 0);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-zinc-900">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
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
              Add Expense
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
              {filterMode === "month" &&
                `${MONTHS[selectedMonth]} ${selectedYear}`}
              {filterMode === "year" && `${selectedYear}`}
              {filterMode === "all" && "All time"}
              {" · "}
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Total Spent"
              value={`$${total.toFixed(2)}`}
              sub={
                filterMode === "month"
                  ? `${MONTHS[selectedMonth]} ${selectedYear}`
                  : filterMode === "year"
                    ? String(selectedYear)
                    : "All time"
              }
            />
            <StatCard
              label="Transactions"
              value={filtered.length}
              sub="in selected period"
            />
            <StatCard
              label="Largest Expense"
              value={largest ? `$${largest.amount.toFixed(2)}` : "—"}
              sub={largest?.description ?? ""}
              accent="text-red-500"
            />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-4">
                Spending by Category ·{" "}
                {filterMode === "month"
                  ? `${MONTHS[selectedMonth]} ${selectedYear}`
                  : filterMode === "year"
                    ? selectedYear
                    : "All Time"}
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
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        -${t.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recurring transactions — full width */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recurring
                    .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
                    .map((r) => {
                      const days = daysUntil(r.nextDue);
                      const isOverdue = days < 0;
                      const isDueSoon = days >= 0 && days <= 3;
                      return (
                        <div
                          key={r.id}
                          className="relative group flex flex-col gap-2 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors"
                        >
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteRecurring(r.id)}
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
                                backgroundColor:
                                  CATEGORY_CONFIG[r.category]?.color ??
                                  "#94a3b8",
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

                          {/* Badges row */}
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
                    })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModal && <AddExpense onClose={handleAddClose} />}
      {showRecurringModal && (
        <AddRecurringModal
          onClose={() => setShowRecurringModal(false)}
          onAdd={handleAddRecurring}
        />
      )}
    </div>
  );
}

export default Dashboard;
