# Frontend

React + Vite app for BrokeBuddy. Styled with Tailwind CSS, charts via Recharts.

## Setup

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## File Structure

```
frontend/src/
├── App.jsx                     # Root component — routing, auth context
├── axios.jsx                   # Axios instance with token refresh interceptor
├── constants.js                # Shared category config, badge styles, months, frequencies
├── theme.js                    # Dark/light mode logic
├── components/
│   ├── pages/
│   │   ├── Signin.jsx          # Sign in page
│   │   ├── Signup.jsx          # Sign up page with password confirmation
│   │   └── Transactions.jsx    # Full transaction list with filters and edit/delete
│   ├── dashboard/
│   │   ├── Dashboard.jsx       # Main dashboard layout and grid
│   │   ├── useDashboard.js     # Data fetching, state, and derived values for the dashboard
│   │   ├── StatCard.jsx        # Reusable stat summary card
│   │   ├── BudgetCard.jsx      # Monthly budget progress bars
│   │   ├── RecurringRow.jsx    # Single recurring transaction row with paid toggle, edit, delete
│   │   └── CustomTooltip.jsx   # Custom tooltip for the pie chart
│   ├── account/
│   │   ├── Account.jsx         # Account settings page layout
│   │   ├── ProfileForm.jsx     # Update name and email
│   │   ├── PasswordForm.jsx    # Change password
│   │   └── DeleteSection.jsx   # Delete account
│   ├── modals/
│   │   ├── AddExpense.jsx          # Add a transaction
│   │   ├── DeleteExpense.jsx       # Confirm delete a transaction
│   │   ├── AddRecurringModal.jsx   # Add a recurring transaction
│   │   ├── EditRecurringModal.jsx  # Edit a recurring transaction
│   │   ├── DeleteRecurring.jsx     # Confirm delete a recurring transaction
│   │   └── SetBudgetModal.jsx      # Set or edit a monthly budget
│   ├── layout/
│   │   └── Sidebar.jsx         # Navigation sidebar
│   └── shared/
│       ├── ThemeToggle.jsx     # Dark/light mode toggle button
│       └── UserProfilePopover.jsx  # User avatar popover with signout
└── utils/
    └── recurringUtils.js       # Date helpers for recurring transaction logic
```

## Core Files

### `App.jsx`
Root component. Manages `currentUser` state in a `UserContext` that is shared across the app. On load, calls `GET /me` to restore the session from the existing cookie — if it fails, the user is treated as unauthenticated. Defines all routes and wraps protected routes in a `ProtectedRoute` guard that redirects to `/signin` if no user is present.

### `axios.jsx`
Configured Axios instance with `baseURL` and `withCredentials: true` so cookies are sent automatically. The response interceptor handles token expiry — on a `401`, it calls `POST /refresh` to get a new access token and retries the original request. Concurrent requests that 401 while a refresh is in progress are queued and replayed once the refresh completes, rather than triggering multiple refresh calls.

### `constants.js`
Single source of truth for:
- `CATEGORY_CONFIG` — maps category keys to display labels and chart colours
- `CATEGORY_BADGE` — Tailwind classes for category badge colours
- `MONTHS` — month name abbreviations
- `FREQUENCIES` — recurring transaction frequency options
- `FREQ_BADGE` — Tailwind classes for frequency badge colours

### `utils/recurringUtils.js`
Date helpers for recurring transaction logic:
- `buildNextDue(dueDay, currentMonth?)` — returns the next upcoming due date as a `Date` object
- `formatNextDue(date)` — formats a `Date` to `YYYY-MM-DD`
- `deriveIsPaid(nextDue, dueDay)` — returns `true` if `nextDue` is beyond the current month's due date (i.e. the bill has been marked paid for this cycle)
- `advanceToNextMonth(dueDay)` — returns the equivalent due date in the next calendar month

### `components/dashboard/useDashboard.js`
Custom hook that owns all dashboard data and logic. On mount, fetches transactions, recurring transactions, and budgets in parallel. Exposes:

| Value | Description |
|-------|-------------|
| `transactions` / `filtered` | All transactions and the currently filtered subset |
| `filterMode`, `selectedMonth`, `selectedYear` | Filter state |
| `total`, `totalDeposits` | Spending and income totals for the filtered period |
| `categoryTotals` | Per-category spending breakdown for the pie chart |
| `recent` | 5 most recent transactions |
| `recurring` | Recurring transactions sorted by urgency |
| `monthlyRecurringTotal` | Estimated monthly cost of all recurring transactions |
| `budgets`, `currentMonthSpending` | Budget targets and actual spend for the current calendar month |
| `addRecurring`, `updateRecurring`, `deleteRecurring` | Local state updaters for recurring transactions |
| `setBudget`, `deleteBudget` | API calls + local state updaters for budgets |

`currentMonthSpending` is always computed against the current calendar month regardless of the active filter, so budget progress bars stay accurate.

### `components/dashboard/RecurringRow.jsx`
Renders a single recurring transaction. Derives paid/unpaid status from `nextDue` and the current date using `deriveIsPaid`. The "Mark paid" toggle PATCHes `/updaterecurringnextdue` to persist the new `nextDue` date. Edit and delete buttons appear on hover.

### `components/dashboard/BudgetCard.jsx`
Renders a progress bar for each category that has a budget set. Bar colour: green below 75%, amber at 75–99%, red at or over 100%. Shows an "Over budget by $X" label when exceeded. Edit and Remove actions appear on hover.

## Auth Flow

1. On load — `App.jsx` calls `GET /me` to check for an existing session
2. Sign in — sets HTTP-only cookies, `setCurrentUser` updates context, redirects to `/dashboard`
3. Sign out — calls `POST /signout` to clear cookies, resets `currentUser` to `null`
4. Token expiry — handled transparently by the Axios interceptor, no user action needed
