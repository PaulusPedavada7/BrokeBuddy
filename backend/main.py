from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, time
from dotenv import load_dotenv

load_dotenv()

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
    seen = set(os.listdir('STATEMENTS_FOLDER'))
    while True:
        current = set(os.listdir('STATEMENTS_FOLDER'))
        new_files = current - seen
        for file in new_files:
            parser(os.path.join('STATEMENTS_FOLDER', file))
        seen = current
        time.sleep(10)

def parser (pdf_file):
    print('hello')