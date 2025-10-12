from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.post("/send")
async def send_message(request: Request):
    # Read JSON body directly
    data = await request.json()
    name = data.get("name", "Unknown")
    message = data.get("message", "")

    print(f"Received from React: name={name}, message={message}")
    return {"reply": f"Got your message, {name}!"}