import { useEffect, useState } from "react";
import api from "../../axios.jsx";
import { CATEGORY_CONFIG, MONTHS } from "../../constants.js";

export function useDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [filterMode, setFilterMode] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [recurring, setRecurring] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recurring") ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    api.get("/gettransactions").then((res) => setTransactions(res.data));
  }, []);

  useEffect(() => {
    localStorage.setItem("recurring", JSON.stringify(recurring));
  }, [recurring]);

  function refreshTransactions() {
    api.get("/gettransactions").then((res) => setTransactions(res.data));
  }

  function addRecurring(item) {
    setRecurring((prev) => [...prev, item]);
  }

  function deleteRecurring(id) {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  }

  // Available years derived from transactions
  const availableYears = [
    ...new Set(transactions.map((t) => new Date(t.date).getFullYear())),
  ].sort((a, b) => b - a);
  if (!availableYears.includes(selectedYear))
    availableYears.unshift(selectedYear);

  // Filtered transactions
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    if (filterMode === "month")
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    if (filterMode === "year") return d.getFullYear() === selectedYear;
    return true;
  });

  // Derived stats
  const withdrawals = filtered.filter((t) => t.amount < 0);
  const deposits = filtered.filter((t) => t.amount > 0);

  const total = withdrawals.reduce((sum, t) => sum + t.amount, 0); // negative sum
  const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);

  const largest = withdrawals.reduce(
    (max, t) => (t.amount < (max?.amount ?? 0) ? t : max),
    null,
  );

  const categoryTotals = Object.entries(
    withdrawals.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += Math.abs(t.amount); // use absolute values for the chart
      return acc;
    }, {}),
  )
    .map(([key, value]) => {
      const { label, color } = CATEGORY_CONFIG[key] ?? {
        label: key,
        color: "#94a3b8",
      };
      const totalWithdrawals = withdrawals.reduce(
        (s, t) => s + Math.abs(t.amount),
        0,
      );
      const percent =
        totalWithdrawals > 0
          ? ((value / totalWithdrawals) * 100).toFixed(1)
          : "0.0";
      return { name: label, value, color, percent };
    })
    .filter((c) => c.value > 0);

  const recent = [...filtered]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const monthlyRecurringTotal = recurring.reduce((sum, r) => {
    if (r.frequency === "monthly") return sum + r.amount;
    if (r.frequency === "weekly") return sum + r.amount * 4.33;
    if (r.frequency === "yearly") return sum + r.amount / 12;
    return sum;
  }, 0);

  const filterLabel =
    filterMode === "month"
      ? `${MONTHS[selectedMonth]} ${selectedYear}`
      : filterMode === "year"
        ? String(selectedYear)
        : "All time";

  return {
    // Raw state
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
    // Derived
    total,
    totalDeposits,
    largest,
    categoryTotals,
    recent,
    monthlyRecurringTotal,
    filterLabel,
    // Actions
    refreshTransactions,
    addRecurring,
    deleteRecurring,
  };
}
