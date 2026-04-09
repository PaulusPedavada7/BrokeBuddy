from typing import Optional
import re

from pydantic import BaseModel, Field, field_validator
from datetime import datetime

# Schema for user creation
def validate_password_complexity(v: str) -> str:
    if not re.search(r"[A-Z]", v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", v):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", v):
        raise ValueError("Password must contain at least one number")
    if not re.search(r"[^A-Za-z0-9]", v):
        raise ValueError("Password must contain at least one special character")
    return v

class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v):
        return validate_password_complexity(v)

# Schema for user sign in
class UserSignIn(BaseModel):
    email: str
    password: str

class TransactionCreate(BaseModel):
    amount: float
    category: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=1, max_length=500)
    date: datetime

class TransactionUpdate(BaseModel):
    """
    All fields are optional — only the ones included in the request body will be updated.
    """
    amount: Optional[float] = None
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    date: Optional[datetime] = None


class RecurringTransactionCreate(BaseModel):
    amount: float
    category: str
    description: str = Field(..., min_length=1, max_length=200)
    date: int
    frequency: str
    isPaid: bool = False

class RecurringTransactionUpdate(BaseModel):
    """
    All fields are optional — only the ones included in the request body will be updated.
    """
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = Field(None, min_length=1, max_length=200)
    date: Optional[int] = None
    frequency: Optional[str] = None

class RecurringNextDueUpdate(BaseModel):
    nextDue: str

class ProfileUpdate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., max_length=254)

class BudgetCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=50)
    amount: float = Field(..., gt=0)

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_complexity(cls, v):
        return validate_password_complexity(v)
