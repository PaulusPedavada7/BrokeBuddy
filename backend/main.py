import os
from dotenv import load_dotenv
# Load environment variables
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from db import RecurringTransaction, get_db, engine, Base, User, Transaction, Budget
from schemas import RecurringTransactionCreate, RecurringTransactionUpdate, RecurringNextDueUpdate, UserCreate, UserSignIn, TransactionCreate, TransactionUpdate, ProfileUpdate, PasswordUpdate, BudgetCreate
from utils import compute_next_due
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

def _rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests, please slow down."})

limiter = Limiter(key_func=get_remote_address, default_limits=[])
app = FastAPI(title="Broke Buddy API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

DATABASE_URL = os.getenv("DATABASE_URL")
SECURE_COOKIES = os.getenv("SECURE_COOKIES", "false").lower() == "true"
COOKIE_SAMESITE = "none" if SECURE_COOKIES else "lax"

Base.metadata.create_all(bind=engine)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"))

# Use OAuth2PasswordBearer for token authentication (not used in this implementation since we're using cookies, but can be useful for future API endpoints)
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="signin")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Allow React to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        *([os.getenv("FRONTEND_URL")] if os.getenv("FRONTEND_URL") else []),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

# LOGIN--------------------------------------------------------------------

# Helper function to create access tokens
def create_token(data: dict, token_type: str, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "type": token_type})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Endpoint for signing up
@app.post("/signup")
@limiter.limit("10/minute")
def signup(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    # Raise an error if the email is already registered
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Creates and adds a new user
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=pwd_context.hash(user.password))
    try:
        db.add(new_user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "User created successfully"}

# Endpoint for signing in
@app.post("/signin")
@limiter.limit("5/minute")
def signin(request: Request, user: UserSignIn, response: Response, db: Session = Depends(get_db)):
    # Raise an error if incorrect email/password
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Creates access token
    access_token = create_token(
        data={"sub": db_user.email},
        token_type="access",
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Creates refresh token
    refresh_token = create_token(
        data={"sub": db_user.email},
        token_type="refresh",
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    # Set secure HTTP-only cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite=COOKIE_SAMESITE
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite=COOKIE_SAMESITE
    )

    return {"message": "Signed in successful"}

@app.post("/signout")
def signout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite=COOKIE_SAMESITE
    )
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite=COOKIE_SAMESITE
    )
    return {"message": "Signed out successfully"}

# Endpoint for refreshing tokens
@app.post("/refresh")
@limiter.limit("20/minute")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = create_token(
        data={"sub": user.email},
        token_type="access",
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    new_refresh_token = create_token(
        data={"sub": user.email},
        token_type="refresh",
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite=COOKIE_SAMESITE
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite=COOKIE_SAMESITE
    )

    return {"message": "Access token refreshed"}

# Helper function to get current user from token
def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Access token missing")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Protected endpoint to get current user info
@app.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
    }
    
@app.patch("/updateprofile")
def update_profile(updates: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Raise an exception if email already in use (id != check to prevent returning the current user)
    if db.query(User).filter(User.email == updates.email, User.id != current_user.id).first():
        raise HTTPException(status_code=400, detail="Email already in use")
    
    current_user.first_name = updates.first_name
    current_user.last_name = updates.last_name
    current_user.email = updates.email

    try:
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
    }

@app.patch("/updatepassword")
def update_password(updates: PasswordUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not pwd_context.verify(updates.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = pwd_context.hash(updates.new_password)

    try:
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"message": "Password updated successfully"}

@app.delete("/deleteaccount")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        db.delete(current_user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Account deleted successfully"}
    
# TRANSACTIONS--------------------------------------------------------------------

    
# Endpoint to add a transaction
@app.post("/addtransaction")
def add_transaction(transaction: TransactionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_transaction = Transaction(
        userid=current_user.id,
        amount=transaction.amount,
        category=transaction.category,
        description=transaction.description,
        date=transaction.date
    )
    try:
        db.add(new_transaction)
        db.commit()
        # db.refresh(new_transaction)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"message": "Transaction added successfully", "transaction_id": new_transaction.id}

@app.get("/gettransactions")
def get_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transactions = db.query(Transaction).filter(Transaction.userid == current_user.id).all()
    return transactions

# Endpoint to partially update a transaction (category, amount, description, date)
@app.patch("/updatetransaction/{transaction_id}")
def update_transaction(
    transaction_id: int,
    updates: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.userid == current_user.id
    ).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Only apply fields that were actually sent in the request (exclude_unset=True)
    changed_fields = updates.model_dump(exclude_unset=True)
    if not changed_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    if "amount" in changed_fields:
        transaction.amount = changed_fields["amount"]
    if "category" in changed_fields:
        transaction.category = changed_fields["category"]
    if "description" in changed_fields:
        transaction.description = changed_fields["description"]
    if "date" in changed_fields:
        transaction.date = changed_fields["date"]

    try:
        db.commit()
        db.refresh(transaction)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return transaction

@app.delete("/deletetransaction/{transaction_id}")
def delete_transaction(transaction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.userid == current_user.id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    try:
        db.delete(transaction)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"message": "Transaction deleted successfully"}

@app.get("/getrecurringtransactions")
def get_recurring_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transactions = db.query(RecurringTransaction).filter(
        RecurringTransaction.userid == current_user.id
    ).all()
    return [
        {
            "id": t.id,
            "description": t.description,
            "amount": t.amount,
            "category": t.category,
            "dueDay": t.dueDate,
            "frequency": t.frequency,
            "nextDue": t.nextDue,
        }
        for t in transactions
    ]

@app.post("/addrecurringtransaction")
def add_recurring_transaction(transaction: RecurringTransactionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_recurring = RecurringTransaction(
        userid=current_user.id,
        amount=transaction.amount,
        category=transaction.category,
        description=transaction.description,
        dueDate=transaction.date,
        frequency=transaction.frequency,
        nextDue=compute_next_due(transaction.date),
    )
    try:
        db.add(new_recurring)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Recurring transaction added successfully", "transaction_id": new_recurring.id}

@app.delete("/deleterecurringtransaction/{transaction_id}")
def delete_recurring_transaction(transaction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recurring = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == transaction_id,
        RecurringTransaction.userid == current_user.id
    ).first()

    if not recurring:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    try:
        db.delete(recurring)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Recurring transaction deleted successfully"}

@app.patch("/updaterecurringtransaction/{transaction_id}")
def update_recurring_transaction(transaction_id: int, updates: RecurringTransactionUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recurring = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == transaction_id,
        RecurringTransaction.userid == current_user.id
    ).first()

    if not recurring:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    changed = updates.model_dump(exclude_unset=True)
    if not changed:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    if "amount" in changed:
        recurring.amount = changed["amount"]
    if "category" in changed:
        recurring.category = changed["category"]
    if "description" in changed:
        recurring.description = changed["description"]
    if "frequency" in changed:
        recurring.frequency = changed["frequency"]
    if "date" in changed:
        recurring.dueDate = changed["date"]
        recurring.nextDue = compute_next_due(changed["date"])

    try:
        db.commit()
        db.refresh(recurring)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "id": recurring.id,
        "description": recurring.description,
        "amount": recurring.amount,
        "category": recurring.category,
        "dueDay": recurring.dueDate,
        "frequency": recurring.frequency,
        "nextDue": recurring.nextDue,
    }

@app.patch("/updaterecurringnextdue/{transaction_id}")
def update_recurring_next_due(transaction_id: int, update: RecurringNextDueUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recurring = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == transaction_id,
        RecurringTransaction.userid == current_user.id
    ).first()

    if not recurring:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    recurring.nextDue = update.nextDue
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Next due date updated successfully"}

# BUDGETS--------------------------------------------------------------------

@app.get("/getbudgets")
def get_budgets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budgets = db.query(Budget).filter(Budget.userid == current_user.id).all()
    return [{"id": b.id, "category": b.category, "amount": b.amount} for b in budgets]

@app.post("/setbudget")
def set_budget(budget: BudgetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Budget).filter(
        Budget.userid == current_user.id,
        Budget.category == budget.category
    ).first()
    if existing:
        existing.amount = budget.amount
    else:
        db.add(Budget(userid=current_user.id, category=budget.category, amount=budget.amount))
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"message": "Budget set successfully"}

@app.delete("/deletebudget/{category}")
def delete_budget(category: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(
        Budget.userid == current_user.id,
        Budget.category == category
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    try:
        db.delete(budget)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"message": "Budget deleted successfully"}