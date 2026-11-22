from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetStatus,
    BudgetOverviewResponse
)
from app.services.analytics_service import CATEGORY_COLORS

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=BudgetOverviewResponse)
def get_budgets(
    month_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not month_year:
        month_year = datetime.now(timezone.utc).strftime("%Y-%m")

    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month_year == month_year
    ).all()

    # Calculate actual expenses per category for this month
    all_expenses = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense"
    ).all()

    # Filter to transactions in this month_year
    category_spending_map = {}
    for t in all_expenses:
        t_my = t.date.strftime("%Y-%m")
        if t_my == month_year:
            category_spending_map[t.category] = category_spending_map.get(t.category, 0.0) + float(t.amount)

    total_budget = sum(b.monthly_limit for b in budgets)
    total_spent = sum(category_spending_map.get(b.category, 0.0) for b in budgets)
    overall_percentage = (total_spent / total_budget * 100) if total_budget > 0 else 0.0

    category_statuses = []
    for b in budgets:
        spent = category_spending_map.get(b.category, 0.0)
        remaining = max(b.monthly_limit - spent, 0.0)
        pct = (spent / b.monthly_limit * 100) if b.monthly_limit > 0 else 0.0

        if pct > 100:
            status_label = "EXCEEDED"
        elif pct >= 90:
            status_label = "CRITICAL"
        elif pct >= 70:
            status_label = "WARNING"
        else:
            status_label = "SAFE"

        category_statuses.append(BudgetStatus(
            id=b.id,
            category=b.category,
            monthly_limit=round(b.monthly_limit, 2),
            spent=round(spent, 2),
            remaining=round(remaining, 2),
            percentage_used=round(pct, 1),
            status=status_label,
            color=CATEGORY_COLORS.get(b.category, "#38BDF8")
        ))

    return BudgetOverviewResponse(
        month_year=month_year,
        total_budget=round(total_budget, 2),
        total_spent=round(total_spent, 2),
        overall_percentage=round(overall_percentage, 1),
        categories=category_statuses
    )

@router.post("", response_model=BudgetResponse)
def create_or_update_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget_in.category,
        Budget.month_year == budget_in.month_year
    ).first()

    if existing:
        existing.monthly_limit = budget_in.monthly_limit
        db.commit()
        db.refresh(existing)
        return existing

    new_budget = Budget(
        user_id=current_user.id,
        category=budget_in.category,
        monthly_limit=budget_in.monthly_limit,
        month_year=budget_in.month_year
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget

@router.put("/{id}", response_model=BudgetResponse)
def update_budget(
    id: int,
    budget_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(Budget.id == id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    budget.monthly_limit = budget_update.monthly_limit
    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/{id}")
def delete_budget(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(Budget.id == id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return {"message": "Budget limit removed successfully"}

@router.get("/ai-recommendations")
def get_ai_budget_recommendations(
    current_user: User = Depends(get_current_user)
):
    """
    Returns AI-recommended category limits calculated from user's income
    using the fintech standard 50/30/20 wealth formula.
    """
    income = float(current_user.monthly_income or 6000.0)
    
    # 50% Needs, 30% Wants, 20% Savings
    return {
        "monthly_income": income,
        "recommended_savings": round(income * 0.20, 2),
        "recommended_budgets": [
            {"category": "Bills", "limit": round(income * 0.30, 2), "bucket": "Needs (Rent & Utilities)"},
            {"category": "Food", "limit": round(income * 0.12, 2), "bucket": "Needs & Dining"},
            {"category": "Healthcare", "limit": round(income * 0.05, 2), "bucket": "Needs"},
            {"category": "Shopping", "limit": round(income * 0.10, 2), "bucket": "Wants"},
            {"category": "Entertainment", "limit": round(income * 0.05, 2), "bucket": "Wants"},
            {"category": "Travel", "limit": round(income * 0.08, 2), "bucket": "Wants"},
            {"category": "Education", "limit": round(income * 0.05, 2), "bucket": "Self-Growth"},
            {"category": "Investments", "limit": round(income * 0.15, 2), "bucket": "Wealth Building"}
        ]
    }
