# BrokeBuddy

A personal finance tracking web app that helps you manage transactions, recurring bills, and monthly spending budgets.

## Features

- **Transaction tracking** — log income and expenses by category and date
- **Recurring transactions** — track bills and subscriptions with due date tracking and paid/unpaid status
- **Monthly budgets** — set per-category spending limits with live progress bars
- **Dashboard** — spending breakdown by category, income vs expenses summary, recent transactions
- **Account management** — update profile, change password, delete account

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| Database | Supabase (hosted PostgreSQL) |
| Auth | JWT (access + refresh tokens via HTTP-only cookies) |

## Project Structure

```
BrokeBuddy/
├── frontend/        # React app
├── backend/         # FastAPI server
└── README.md
```

See `frontend/README.md` and `backend/README.md` for detailed setup and file structure.

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- A Supabase project

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
DATABASE_URL=your_supabase_connection_string
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
SECURE_COOKIES=false   # set to true in production
```

Run the server:

```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Database Migrations

The app uses SQLAlchemy's `create_all` for initial table creation. Any schema changes after the initial setup must be run manually in the Supabase SQL editor. See `backend/README.md` for the full migration history.

## Deployment

- Set `SECURE_COOKIES=true` in production environment variables
- Update CORS `allow_origins` in `backend/main.py` to your production frontend URL
- Recommended: Railway or Render for the backend, Vercel or Netlify for the frontend
