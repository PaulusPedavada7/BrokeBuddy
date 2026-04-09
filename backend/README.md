# Backend

FastAPI REST API server for BrokeBuddy. Handles authentication, data persistence, and all business logic.

## Setup

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`. Interactive API docs available at `http://localhost:8000/docs`.

## Environment Variables

Create a `.env` file in this directory:

```
DATABASE_URL=your_supabase_connection_string
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
SECURE_COOKIES=false   # set to true in production
```

Never commit `.env` to git.

## File Structure

```
backend/
├── main.py           # All API route definitions
├── db.py             # Database models and connection setup
├── schemas.py        # Pydantic request/response schemas
├── utils.py          # Shared helper functions
├── parse.py          # Bank statement parsing (in development)
├── requirements.txt  # Python dependencies
└── .env              # Local environment variables (gitignored)
```

## Core Files

### `main.py`
The entry point for the API. Contains all route handlers grouped by feature:

| Section | Routes |
|---------|--------|
| Auth | `POST /signup`, `POST /signin`, `POST /signout`, `POST /refresh` |
| User | `GET /me`, `PATCH /updateprofile`, `PATCH /updatepassword`, `DELETE /deleteaccount` |
| Transactions | `GET /gettransactions`, `POST /addtransaction`, `PATCH /updatetransaction/{id}`, `DELETE /deletetransaction/{id}` |
| Recurring | `GET /getrecurringtransactions`, `POST /addrecurringtransaction`, `PATCH /updaterecurringtransaction/{id}`, `PATCH /updaterecurringnextdue/{id}`, `DELETE /deleterecurringtransaction/{id}` |
| Budgets | `GET /getbudgets`, `POST /setbudget`, `DELETE /deletebudget/{category}` |

Also contains:
- CORS middleware configuration
- Rate limiting setup (slowapi) — `/signin` 5/min, `/signup` 10/min, `/refresh` 20/min
- `get_current_user` dependency — validates JWT access token on every protected route
- `create_token` — signs JWTs with a `type` claim (`"access"` or `"refresh"`) to prevent token type confusion

### `db.py`
SQLAlchemy ORM models and database connection. Defines the following tables:

| Model | Table | Key Fields |
|-------|-------|-----------|
| `User` | `users` | `id`, `first_name`, `last_name`, `email`, `hashed_password` |
| `Transaction` | `transactions` | `id`, `userid`, `amount`, `category`, `description`, `date` |
| `RecurringTransaction` | `recurring_transactions` | `id`, `userid`, `amount`, `category`, `description`, `dueDate`, `frequency`, `nextDue` |
| `Budget` | `budgets` | `id`, `userid`, `category`, `amount` |

`create_all` is called on startup to create tables that don't exist. **It does not modify existing tables** — schema changes must be applied manually via SQL.

### `schemas.py`
Pydantic models for request validation. All string fields have `min_length`/`max_length` constraints. Passwords enforce complexity rules (uppercase, lowercase, number, special character, min 8 chars) via a shared `validate_password_complexity` validator applied to both `UserCreate` and `PasswordUpdate`.

### `utils.py`
- `compute_next_due(due_day)` — given a day of the month, returns the next upcoming due date as an ISO string. Used when creating or updating recurring transactions.

## Auth Flow

1. `POST /signin` — verifies credentials, sets `access_token` and `refresh_token` as HTTP-only cookies
2. Every protected request — `get_current_user` reads `access_token` cookie, decodes JWT, returns the user
3. On 401 — frontend interceptor calls `POST /refresh`, which validates the `refresh_token` cookie, issues a new access token **and** a new refresh token (rotation), and sets both cookies
4. `POST /signout` — clears both cookies

## Database Migrations

Schema changes after initial deployment must be run manually in Supabase SQL Editor:

```sql
-- Add nextDue to recurring_transactions
ALTER TABLE recurring_transactions ADD COLUMN "nextDue" VARCHAR NOT NULL DEFAULT '';

-- Add description to recurring_transactions
ALTER TABLE recurring_transactions ADD COLUMN description VARCHAR NOT NULL DEFAULT '';

-- Create budgets table
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR NOT NULL,
  amount FLOAT NOT NULL,
  UNIQUE(userid, category)
);
```

## Security

- Passwords hashed with bcrypt
- JWTs signed with HS256, include a `type` claim to distinguish access vs refresh tokens
- Auth cookies are HTTP-only and `samesite=lax` — set `SECURE_COOKIES=true` in production
- Rate limiting on all auth endpoints
- SQL injection prevented via SQLAlchemy ORM (parameterized queries)
- Input validated at the schema layer before any database interaction
