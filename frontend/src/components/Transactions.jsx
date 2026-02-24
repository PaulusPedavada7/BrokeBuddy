import React, { useEffect, useState, useContext } from "react";
import api from "../axios.jsx";
import { useNavigate } from 'react-router-dom';
import { UserContext } from "../App.jsx";
import Sidebar from "./Sidebar.jsx";
import AddExpense from "./AddExpense.jsx";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PAGE_SIZE = 10;

const CATEGORY_STYLES = {
  food:          { label: "Dining",        classes: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  transport:     { label: "Travel",        classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  entertainment: { label: "Entertainment", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  utilities:     { label: "Utilities",     classes: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};

function CategoryBadge({ category }) {
  const style = CATEGORY_STYLES[category] ?? { label: category, classes: "bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300" };
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${style.classes}`}>
      {style.label}
    </span>
  );
}

function SortIcon({ active, direction }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ml-1 inline ${active ? "opacity-100" : "opacity-30"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      {direction === "asc"
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />}
    </svg>
  );
}

function Transactions() {
  const { currentUser } = useContext(UserContext);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Filter state
  const [filterMode, setFilterMode] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Sort state — default: date descending
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/gettransactions").then(res => setTransactions(res.data));
  }, []);

  // Reset to page 1 when filters or sort changes
  useEffect(() => { setPage(1); }, [filterMode, selectedMonth, selectedYear, sortKey, sortDir]);

  async function handleDelete(id) {
    try {
      await api.delete(`/deletetransaction/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error(error?.response?.data?.detail || error.message);
    }
  }

  function handleAddClose() {
    setShowModal(false);
    api.get("/gettransactions").then(res => setTransactions(res.data));
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  // Available years derived from data
  const availableYears = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
  if (!availableYears.includes(selectedYear)) availableYears.unshift(selectedYear);

  // 1. Filter
  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    if (filterMode === "month") return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    if (filterMode === "year")  return d.getFullYear() === selectedYear;
    return true;
  });

  // 2. Sort
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortKey === "date")   diff = new Date(a.date) - new Date(b.date);
    if (sortKey === "amount") diff = a.amount - b.amount;
    return sortDir === "asc" ? diff : -diff;
  });

  // 3. Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Build page numbers with ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-zinc-900">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-8 py-8 max-w-6xl w-full mx-auto">

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Transactions</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">A full history of your expenses</p>
          </div>

          {/* Filter + action bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Mode toggle */}
            <div className="flex gap-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-1">
              {["month", "year", "all"].map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterMode === mode
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {mode === "all" ? "All Time" : mode === "month" ? "By Month" : "By Year"}
                </button>
              ))}
            </div>

            {/* Year dropdown */}
            {(filterMode === "month" || filterMode === "year") && (
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300"
              >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}

            {/* Month pills */}
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

            {/* Result count + Add button */}
            <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Transaction
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60">
                  <th
                    onClick={() => toggleSort("date")}
                    className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    Date <SortIcon active={sortKey === "date"} direction={sortKey === "date" ? sortDir : "desc"} />
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    Description
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    Category
                  </th>
                  <th
                    onClick={() => toggleSort("amount")}
                    className="text-right px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    Amount <SortIcon active={sortKey === "amount"} direction={sortKey === "amount" ? sortDir : "desc"} />
                  </th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-400 dark:text-zinc-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6M3 17h18" />
                      </svg>
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  paginated.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/40 transition-colors group">
                      <td className="px-6 py-4 text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">
                        {t.description || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <CategoryBadge category={t.category} />
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        ${t.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {sorted.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60">
                <span className="text-xs text-gray-400 dark:text-zinc-500">
                  Page {page} of {totalPages} · {sorted.length} results
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  {pageNumbers.map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          page === p
                            ? "bg-blue-600 text-white"
                            : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      {showModal && <AddExpense onClose={handleAddClose} />}
    </div>
  );
}

export default Transactions;