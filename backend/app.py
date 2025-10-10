import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

FOLDER_TO_WATCH = os.getenv("STATEMENTS_FOLDER", "bank_statements")

# Check if folder exists
if os.path.exists(FOLDER_TO_WATCH) and os.path.isdir(FOLDER_TO_WATCH):
    files = os.listdir(FOLDER_TO_WATCH)
    print("Files in folder:", files)
else:
    print(f"Folder '{FOLDER_TO_WATCH}' does not exist.")