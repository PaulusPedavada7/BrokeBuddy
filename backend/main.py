import os
from dotenv import load_dotenv
# Load environment variables
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from db import RecurringTransaction, get_db, engine, Base, User, Transaction
from schemas import RecurringTransactionCreate, UserCreate, UserSignIn, TransactionCreate, TransactionUpdate, ProfileUpdate, PasswordUpdate
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

app = FastAPI(title="Broke Buddy API")

DATABASE_URL = os.getenv("DATABASE_URL")
print("***************************************************")
print("DATABASE_URL:", DATABASE_URL)  # add this

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
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to create access tokens
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

# Endpoint for signing up
@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
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
def signin(user: UserSignIn, response: Response, db: Session = Depends(get_db)):
    # Raise an error if incorrect email/password
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Creates access token
    access_token = create_access_token(
        data={"sub": db_user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Creates refresh token
    refresh_token = create_access_token(
        data={"sub": db_user.email},
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    # Set secure HTTP-only cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False, # Allows both HTTP and HTTPS (for production: True = HTTPS only)
        samesite="lax"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False, # Allows both HTTP and HTTPS (for production: True = HTTPS only)
        samesite="lax"
    )

    return {"message": "Signed in successful"}

@app.post("/signout")
def signout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax"
    )
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite="lax"
    )
    return {"message": "Signed out successfully"}

# Endpoint for refreshing tokens
@app.post("/refresh")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Creates new access token
    new_access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=False, # Allows both HTTP and HTTPS (for production: True = HTTPS only)
        samesite="lax"
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
        if email is None:
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

    for field, value in changed_fields.items():
        setattr(transaction, field, value)

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
