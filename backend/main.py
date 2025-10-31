from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, time
from dotenv import load_dotenv
import pdfplumber
import re

load_dotenv()
STATEMENTS_FOLDER = os.getenv("STATEMENTS_FOLDER")

app = FastAPI(title = "Broke Buddy API")

# Allow React to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

def watch_folder():
    print()
    seen = set(os.listdir(STATEMENTS_FOLDER))
    while True:
        current = set(os.listdir(STATEMENTS_FOLDER))
        new_files = current - seen
        for file in new_files:
            parser(os.path.join(STATEMENTS_FOLDER, file))
        seen = current
        time.sleep(10)

pattern = re.compile(
    r"^(\d{2}/\d{2}/\d{2})\s+(.*?)\s+(?:CO\s+)?([-()0-9,]+\.\d{2})$",
    re.IGNORECASE
)
total_re = re.compile(r"([()0-9,]+\.\d{2})$")

def parse_amount(s: str) -> float:
    s = s.strip().replace(",", "")
    negative = s.startswith("(") and s.endswith(")")
    if negative:
        s = s[1:-1]
    return -float(s) if negative else float(s)

def parse_statement_blocks(pdf_path):
    deposits, withdrawals = [], []
    total_deposits, total_withdrawals = None, None
    in_deposits, in_withdrawals = False, False

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue

            for line in text.splitlines():
                line = line.strip()

                # --- Deposits section ---
                if "Deposits and other additions" in line:
                    in_deposits, in_withdrawals = True, False
                    continue

                if "Total deposits and other additions" in line:
                    in_deposits = False
                    m_total = total_re.search(line)
                    if m_total:
                        total_deposits = parse_amount(m_total.group(1))
                    continue

                # --- Withdrawals section ---
                if "Withdrawals and other subtractions" in line:
                    in_withdrawals, in_deposits = True, False
                    continue

                if "Total other subtractions" in line:
                    in_withdrawals = False
                    m_total = total_re.search(line)
                    if m_total:
                        total_withdrawals = parse_amount(m_total.group(1))
                    continue

                # --- Parse lines inside deposit/withdrawal blocks ---
                if in_deposits or in_withdrawals:
                    m = pattern.match(line)
                    if m:
                        date, desc, amt_str = m.groups()
                        amt = parse_amount(amt_str)
                        record = {"date": date, "description": desc.strip(), "amount": amt}
                        if in_deposits:
                            deposits.append(record)
                        else:
                            withdrawals.append(record)

    # Sanity checks
    if total_deposits is not None:
        assert abs(sum(d["amount"] for d in deposits) - total_deposits) < 0.05, \
            "Deposit sum mismatch"
    computed_withdrawals = sum(w["amount"] for w in withdrawals)
    if total_withdrawals is not None:
        assert abs(abs(computed_withdrawals) - abs(total_withdrawals)) < 0.05, \
        f"Withdrawal sum mismatch: computed {computed_withdrawals}, pdf total {total_withdrawals}"

    return deposits, total_deposits, withdrawals, total_withdrawals


# Example usage
def parser(pdf_file):
    deposits, total_deposits, withdrawals, total_withdrawals = parse_statement_blocks(pdf_file)

    print("\n--- Deposits ---")
    for d in deposits:
        print(d)
    print("Total deposits:", total_deposits)

    print("\n--- Withdrawals ---")
    for w in withdrawals:
        print(w)
    print("Total withdrawals:", total_withdrawals)


watch_folder()