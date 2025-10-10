import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
USER_ID = int(os.getenv("USER_ID"))

# Connect to Postgres
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

print(f"Connected to database. Current USER_ID={USER_ID}")

# Example: get this user's transactions
# cur.execute("SELECT id, date, description, amount FROM transactions WHERE user_id = %s;", (USER_ID,))
# transactions = cur.fetchall()
# print("Transactions:", transactions)

# Close connection
cur.close()
conn.close()