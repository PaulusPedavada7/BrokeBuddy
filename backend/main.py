import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from db import get_db, engine, Base, User
from schemas import UserCreate, UserSignIn
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

app = FastAPI(title="Broke Buddy API")

Base.metadata.create_all(bind=engine)

# Load environment variables
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="signin")
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

# def watch_folder():
#     print()
#     seen = set(os.listdir(STATEMENTS_FOLDER))
#     while True:
#         current = set(os.listdir(STATEMENTS_FOLDER))
#         new_files = current - seen
#         for file in new_files:
#             parser(os.path.join(STATEMENTS_FOLDER, file))
#         seen = current
#         time.sleep(10)

# pattern = re.compile(
#     r"^(\d{2}/\d{2}/\d{2})\s+(.*?)\s+(?:CO\s+)?([-()0-9,]+\.\d{2})$",
#     re.IGNORECASE
# )
# total_re = re.compile(r"([()0-9,]+\.\d{2})$")

# def parse_amount(s: str) -> float:
#     s = s.strip().replace(",", "")
#     negative = s.startswith("(") and s.endswith(")")
#     if negative:
#         s = s[1:-1]
#     return -float(s) if negative else float(s)

# def parse_statement_blocks(pdf_path):
#     deposits, withdrawals = [], []
#     total_deposits, total_withdrawals = None, None
#     in_deposits, in_withdrawals = False, False

#     with pdfplumber.open(pdf_path) as pdf:
#         for page in pdf.pages:
#             text = page.extract_text()
#             if not text:
#                 continue

#             for line in text.splitlines():
#                 line = line.strip()

#                 # --- Deposits section ---
#                 if "Deposits and other additions" in line:
#                     in_deposits, in_withdrawals = True, False
#                     continue

#                 if "Total deposits and other additions" in line:
#                     in_deposits = False
#                     m_total = total_re.search(line)
#                     if m_total:
#                         total_deposits = parse_amount(m_total.group(1))
#                     continue

#                 # --- Withdrawals section ---
#                 if "Withdrawals and other subtractions" in line:
#                     in_withdrawals, in_deposits = True, False
#                     continue

#                 if "Total other subtractions" in line:
#                     in_withdrawals = False
#                     m_total = total_re.search(line)
#                     if m_total:
#                         total_withdrawals = parse_amount(m_total.group(1))
#                     continue

#                 # --- Parse lines inside deposit/withdrawal blocks ---
#                 if in_deposits or in_withdrawals:
#                     m = pattern.match(line)
#                     if m:
#                         date, desc, amt_str = m.groups()
#                         amt = parse_amount(amt_str)
#                         record = {"date": date, "description": desc.strip(), "amount": amt}
#                         if in_deposits:
#                             deposits.append(record)
#                         else:
#                             withdrawals.append(record)

#     # Sanity checks
#     if total_deposits is not None:
#         assert abs(sum(d["amount"] for d in deposits) - total_deposits) < 0.05, \
#             "Deposit sum mismatch"
#     computed_withdrawals = sum(w["amount"] for w in withdrawals)
#     if total_withdrawals is not None:
#         assert abs(abs(computed_withdrawals) - abs(total_withdrawals)) < 0.05, \
#         f"Withdrawal sum mismatch: computed {computed_withdrawals}, pdf total {total_withdrawals}"

#     return deposits, total_deposits, withdrawals, total_withdrawals


# # Example usage
# def parser(pdf_file):
#     deposits, total_deposits, withdrawals, total_withdrawals = parse_statement_blocks(pdf_file)

#     print("\n--- Deposits ---")
#     for d in deposits:
#         print(d)
#     print("Total deposits:", total_deposits)

#     print("\n--- Withdrawals ---")
#     for w in withdrawals:
#         print(w)
#     print("Total withdrawals:", total_withdrawals)


# watch_folder()