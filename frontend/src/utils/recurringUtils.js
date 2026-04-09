export function buildNextDue(dueDay, currentMonth = false) {
  const day = parseInt(dueDay, 10);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const year = now.getFullYear();
  const month = now.getMonth();

  function lastDayOfMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }

  function buildDate(y, m, d) {
    const clamped = Math.min(d, lastDayOfMonth(y, m));
    return new Date(y, m, clamped);
  }

  if (currentMonth) return buildDate(year, month, day);

  const candidate = buildDate(year, month, day);
  if (candidate < now) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    return buildDate(nextYear, nextMonth, day);
  }
  return candidate;
}

export function formatNextDue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function deriveIsPaid(nextDue, dueDay) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDue + "T00:00:00");

  const currentMonthDue = new Date(
    today.getFullYear(),
    today.getMonth(),
    dueDay,
  );
  currentMonthDue.setHours(0, 0, 0, 0);

  return due > currentMonthDue;
}

export function advanceToNextMonth(dueDay) {
  const day = parseInt(dueDay, 10);
  const now = new Date();
  const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
  const nextYear =
    now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

  function lastDayOfMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }

  const clamped = Math.min(day, lastDayOfMonth(nextYear, nextMonth));
  return new Date(nextYear, nextMonth, clamped);
}
