import os
import google.generativeai as gen
from dotenv import load_dotenv

# REQUIRED: Load API key from environment
#API_KEY = os.getenv("GOOGLE_API_KEY")
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not found.")

gen.configure(api_key=API_KEY)

# Use the newest **Gemini Flash 2.0** model
MODEL = gen.GenerativeModel("gemini-2.0-flash")


def categorize_transaction(text: str) -> str:
    """
    Categorizes a single bank transaction description using Google Gemini Flash.
    """

    prompt = f"""
You are a financial transaction categorization assistant.
Categorize the following transaction into EXACTLY one of:

- Food & Drink
- Groceries
- Shopping
- Transportation
- Bills & Utilities
- Travel
- Entertainment
- Income
- Other

Return ONLY the category name.

Transaction:
"{text}"
"""

    response = MODEL.generate_content(prompt)

    if not hasattr(response, "text"):
        return "Other"

    # Clean output
    result = response.text.strip().replace(".", "").replace("\n", "")

    return result


examples = [
    "AMZN MKTP US*2KL39 09/12",
    "UBER TRIP HELP.UBER.COM",
    "TRADER JOE'S #839",
    "APPLE.COM/BILL",
    "DELTA AIR 8374927",
    "SQ *KBBQ HOUSE 483939",
]

print("Gemini Categorization Test:")
for text in examples:
    category = categorize_transaction(text)
    print(f"{text}  -->  {category}")
