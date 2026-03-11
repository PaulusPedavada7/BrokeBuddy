from typing import Optional

from pydantic import BaseModel
from datetime import datetime

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

class TransactionCreate(BaseModel):
    amount: float
    category: str
    description: str
    date: datetime
    
class TransactionUpdate(BaseModel):
    """
    All fields are optional — only the ones included in the request body will be updated.
    """
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None


class RecurringTransactionCreate(BaseModel):
    amount: float
    category: str
    date: int
    isPaid: bool = False

class RecurringTransactionUpdate(BaseModel):
    """
    All fields are optional — only the ones included in the request body will be updated.
    """
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[int] = None
    isPaid: Optional[bool] = None

class ProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    email: str

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
