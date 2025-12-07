from pydantic import BaseModel

# Schema for user creation
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

# Schema for user sign in
class UserSignIn(BaseModel):
    email: str
    password: str