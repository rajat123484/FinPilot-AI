from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BudgetBase(BaseModel):
    category: str
    monthly_limit: float = Field(..., gt=0)
    month_year: str = Field(..., pattern=r"^\d{4}-\d{2}$") # e.g. "2026-11"

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    monthly_limit: float = Field(..., gt=0)

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BudgetStatus(BaseModel):
    id: Optional[int] = None
    category: str
    monthly_limit: float
    spent: float
    remaining: float
    percentage_used: float
    status: str # "SAFE" (<70%), "WARNING" (70-90%), "EXCEEDED" (>100%), "CRITICAL" (90-100%)
    color: str

class BudgetOverviewResponse(BaseModel):
    month_year: str
    total_budget: float
    total_spent: float
    overall_percentage: float
    categories: List[BudgetStatus]
