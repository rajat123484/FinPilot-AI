from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardKPIs(BaseModel):
    total_balance: float
    monthly_income: float
    monthly_expenses: float
    total_savings: float
    savings_rate: float
    savings_goal: float
    savings_goal_progress: float
    active_fraud_alerts: int
    budgets_exceeded: int

class IncomeExpenseChartPoint(BaseModel):
    month: str # e.g. "Jun", "Jul", "Aug"
    income: float
    expense: float
    savings: float

class CategorySpendingPoint(BaseModel):
    name: str
    amount: float
    percentage: float
    color: str
    icon: Optional[str] = None

class SpendingTrendPoint(BaseModel):
    date: str
    amount: float
    category: Optional[str] = None

class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKPIs
    income_vs_expenses: List[IncomeExpenseChartPoint]
    category_spending: List[CategorySpendingPoint]
    spending_trends: List[SpendingTrendPoint]
    currency: str

class AnalyticsDeepDiveResponse(BaseModel):
    month_over_month_change: float # % change in expenses
    top_spending_category: str
    top_spending_category_amount: float
    daily_average_expense: float
    projected_end_of_month_expense: float
    recurring_expenses_total: float
    category_breakdown: List[CategorySpendingPoint]
    monthly_breakdown: List[IncomeExpenseChartPoint]
