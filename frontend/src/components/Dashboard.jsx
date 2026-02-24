import React, { useEffect, useState, useContext } from "react";
import api from "../axios.jsx";
import { useNavigate } from 'react-router-dom';
import { UserContext } from "../App.jsx";
import Sidebar from "./Sidebar.jsx";
import AddExpense from "./AddExpense.jsx";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CATEGORY_CONFIG = {
  food:          { label: "Dining",        color: "#f97316" },
  transport:     { label: "Travel",        color: "#3b82f6" },
  entertainment: { label: "Entertainment", color: "#a855f7" },
  utilities:     { label: "Utilities",     color: "#22c55e" },
};

const CATEGORY_BADGE = {
  food:          "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  transport:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  utilities:     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 p-5 shadow-sm flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">{label}</span>
      <span className={`text-2xl font-bold ${accent ?? "text-gray-900 dark:text-white"}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400 dark:text-zinc-500">{sub}</span>}
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, payload: p } = payload[0];
    return (
      <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-2 shadow-lg text-sm">
        <p className="font-semibold text-gray-800 dark:text-white">{name}</p>
        <p className="text-gray-500 dark:text-zinc-400">${value.toFixed(2)} · {p.percent}%</p>
      </div>
    );
  }
  return null;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Dashboard() {
  const { currentUser } = useContext(UserContext);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterMode, setFilterMode] = useState("month"); // "month" | "year" | "all"
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/gettransactions").then(res => setTransactions(res.data));
  }, []);

  function handleAddClose() {
    setShowModal(false);
    api.get("/gettransactions").then(res => setTransactions(res.data));
  }

  // Available years from transaction data
  const availableYears = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
  if (!availableYears.includes(selectedYear)) availableYears.unshift(selectedYear);

  // Filter transactions based on selected mode
  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    if (filterMode === "month") return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    if (filterMode === "year")  return d.getFullYear() === selectedYear;
    return true; // "all"
  });

  // Derived stats
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  const largest = filtered.reduce((max, t) => t.amount > (max?.amount ?? 0) ? t : max, null);

  // Pie chart data
  const categoryTotals = Object.entries(CATEGORY_CONFIG).map(([key, { label, color }]) => {
    const value = filtered.filter(t => t.category === key).reduce((s, t) => s + t.amount, 0);
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
    return { name: label, value, color, percent };
  }).filter(c => c.value > 0);

  // Recent transactions (last 5 from filtered)
  const recent = [...filtered]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

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
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Expense
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {/* Mode toggle */}
            <div className="flex gap-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-1">
              {["month", "year", "all"].map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    filterMode === mode
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {mode === "all" ? "All Time" : mode === "month" ? "By Month" : "By Year"}
                </button>
              ))}
            </div>

            {/* Year selector */}
            {(filterMode === "month" || filterMode === "year") && (
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300"
              >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}

            {/* Month selector */}
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

            {/* Active filter label */}
            <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">
              {filterMode === "month" && `${MONTHS[selectedMonth]} ${selectedYear}`}
              {filterMode === "year" && `${selectedYear}`}
              {filterMode === "all" && "All time"}
              {" · "}
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Total Spent" value={`$${total.toFixed(2)}`} sub={
              filterMode === "month" ? `${MONTHS[selectedMonth]} ${selectedYear}` :
              filterMode === "year" ? String(selectedYear) : "All time"
            } />
            <StatCard label="Transactions" value={filtered.length} sub="in selected period" />
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
                Spending by Category · {filterMode === "month" ? `${MONTHS[selectedMonth]} ${selectedYear}` : filterMode === "year" ? selectedYear : "All Time"}
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

                  {/* Legend */}
                  <div className="mt-4 flex flex-col gap-2">
                    {categoryTotals.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-gray-600 dark:text-zinc-300">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 dark:text-zinc-500">{c.percent}%</span>
                          <span className="font-semibold text-gray-800 dark:text-white">${c.value.toFixed(2)}</span>
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
                  {recent.map(t => (
                    <li key={t.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_CONFIG[t.category]?.color ?? "#94a3b8" }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{t.description}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">
                            {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {" · "}
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${CATEGORY_BADGE[t.category] ?? ""}`}>
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

          </div>
        </main>
      </div>

      {showModal && <AddExpense onClose={handleAddClose} />}
    </div>
  );
}

export default Dashboard;