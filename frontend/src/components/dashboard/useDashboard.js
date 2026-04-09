import { useEffect, useState } from "react";
import api from "../../axios.jsx";
import { CATEGORY_CONFIG, MONTHS } from "../../constants.js";
import { deriveIsPaid } from "../../utils/recurringUtils.js";

function priorityScore(r) {
  const paid = deriveIsPaid(r.nextDue, r.dueDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(r.nextDue + "T00:00:00");
  const days = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (paid) {
    return -10000 + days;
  }

  return days < 0 ? 1000 + Math.abs(days) : Math.max(0, 30 - days);
}

export function useDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [filterMode, setFilterMode] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [recurring, setRecurring] = useState([]);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    api.get("/gettransactions").then((res) => setTransactions(res.data));
    api.get("/getrecurringtransactions").then((res) => setRecurring(res.data));
    api.get("/getbudgets").then((res) => setBudgets(res.data));
  }, []);

  function refreshTransactions() {
    api.get("/gettransactions").then((res) => setTransactions(res.data));
  }

  function addRecurring(item) {
    setRecurring((prev) => [...prev, item]);
  }

  function deleteRecurring(id) {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRecurring(updated) {
    setRecurring((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r)),
    );
  }

  async function setBudget(category, amount) {
    await api.post("/setbudget", { category, amount });
    setBudgets((prev) => {
      const existing = prev.find((b) => b.category === category);
      if (existing) return prev.map((b) => b.category === category ? { ...b, amount } : b);
      return [...prev, { category, amount }];
    });
  }

  async function deleteBudget(category) {
    await api.delete(`/deletebudget/${category}`);
    setBudgets((prev) => prev.filter((b) => b.category !== category));
  }

  // Available years derived from transactions
  const availableYears = [
    ...new Set(transactions.map((t) => new Date(t.date).getUTCFullYear())),
  ].sort((a, b) => b - a);
  if (!availableYears.includes(selectedYear))
    availableYears.unshift(selectedYear);

  // Filtered transactions
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    const month = d.getUTCMonth();
    const year = d.getUTCFullYear();
    if (filterMode === "month")
      return month === selectedMonth && year === selectedYear;
    if (filterMode === "year") return year === selectedYear;
    return true;
  });

  // Derived stats
  const withdrawals = filtered.filter((t) => t.amount < 0);
  const deposits = filtered.filter((t) => t.amount > 0);

  const total = withdrawals.reduce((sum, t) => sum + t.amount, 0);
  const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);

  const largest = withdrawals.reduce(
    (max, t) => (t.amount < (max?.amount ?? 0) ? t : max),
    null,
  );

  const categoryTotals = Object.entries(
    withdrawals.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += Math.abs(t.amount);
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

  const now = new Date();
  const currentMonthSpending = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return (
        d.getUTCMonth() === now.getMonth() &&
        d.getUTCFullYear() === now.getFullYear() &&
        t.amount < 0
      );
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

  const monthlyRecurringTotal = recurring.reduce((sum, r) => {
    if (r.frequency === "monthly") return sum + r.amount;
    if (r.frequency === "weekly") return sum + r.amount * 4.33;
    if (r.frequency === "yearly") return sum + r.amount / 12;
    return sum;
  }, 0);

  const sortedRecurring = [...recurring].sort(
    (a, b) => priorityScore(b) - priorityScore(a),
  );

  const filterLabel =
    filterMode === "month"
      ? `${MONTHS[selectedMonth]} ${selectedYear}`
      : filterMode === "year"
        ? String(selectedYear)
        : "All time";

  return {
    transactions,
    filtered,
    recurring: sortedRecurring,
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
  };
}
