import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.fraud_alert import FraudAlert
from app.models.user import User

CATEGORY_COLORS = {
    "Salary": "#10B981",
    "Investments": "#06B6D4",
    "Freelance": "#3B82F6",
    "Food": "#F59E0B",
    "Shopping": "#EC4899",
    "Travel": "#8B5CF6",
    "Education": "#38BDF8",
    "Bills": "#EF4444",
    "Entertainment": "#F97316",
    "Healthcare": "#14B8A6",
    "Miscellaneous": "#94A3B8"
}

CATEGORY_ICONS = {
    "Salary": "Briefcase",
    "Investments": "TrendingUp",
    "Freelance": "Laptop",
    "Food": "Utensils",
    "Shopping": "ShoppingBag",
    "Travel": "Plane",
    "Education": "GraduationCap",
    "Bills": "Zap",
    "Entertainment": "Film",
    "Healthcare": "HeartPulse",
    "Miscellaneous": "HelpCircle"
}

class AnalyticsService:

    def get_dashboard_summary(self, db: Session, user: User) -> Dict[str, Any]:
        """
        Computes overall KPIs, Income vs Expense timeline, Category spending breakdown,
        and recent spending trends for the main dashboard.
        """
        now = datetime.now(timezone.utc)
        current_year = now.year
        current_month = now.month

        # Retrieve user transactions
        transactions = db.query(Transaction).filter(Transaction.user_id == user.id).all()

        if not transactions:
            return self._empty_dashboard(user)

        # Convert to Pandas DataFrame for vector financial calculations
        data = []
        for t in transactions:
            t_date = t.date
            if t_date.tzinfo is None:
                t_date = t_date.replace(tzinfo=timezone.utc)
            data.append({
                "id": t.id,
                "title": t.title,
                "amount": float(t.amount),
                "type": t.type.lower(),
                "category": t.category,
                "date": t_date,
                "month_year": t_date.strftime("%Y-%m"),
                "month_name": t_date.strftime("%b")
            })

        df = pd.DataFrame(data)

        # Current month metrics
        current_my = now.strftime("%Y-%m")
        current_month_df = df[df["month_year"] == current_my]

        monthly_income = float(current_month_df[current_month_df["type"] == "income"]["amount"].sum())
        monthly_expenses = float(current_month_df[current_month_df["type"] == "expense"]["amount"].sum())

        # If user has fixed monthly income profile and no income transaction recorded this month yet, use profile
        if monthly_income == 0 and user.monthly_income:
            monthly_income = float(user.monthly_income)

        total_income_all_time = float(df[df["type"] == "income"]["amount"].sum())
        total_expense_all_time = float(df[df["type"] == "expense"]["amount"].sum())
        total_balance = total_income_all_time - total_expense_all_time

        total_savings = monthly_income - monthly_expenses
        savings_rate = (total_savings / monthly_income * 100) if monthly_income > 0 else 0.0

        savings_goal = float(user.savings_goal or 20000.0)
        savings_goal_progress = min(max((total_balance / savings_goal * 100) if savings_goal > 0 else 0.0, 0.0), 100.0)

        # Active fraud alerts
        active_fraud_alerts = db.query(FraudAlert).filter(
            FraudAlert.user_id == user.id,
            FraudAlert.status == "PENDING"
        ).count()

        # Budgets exceeded
        budgets = db.query(Budget).filter(Budget.user_id == user.id).all()
        budgets_exceeded = 0
        for b in budgets:
            spent = float(current_month_df[(current_month_df["type"] == "expense") & (current_month_df["category"] == b.category)]["amount"].sum())
            if spent > b.monthly_limit:
                budgets_exceeded += 1

        kpis = {
            "total_balance": round(total_balance, 2),
            "monthly_income": round(monthly_income, 2),
            "monthly_expenses": round(monthly_expenses, 2),
            "total_savings": round(total_savings, 2),
            "savings_rate": round(savings_rate, 1),
            "savings_goal": round(savings_goal, 2),
            "savings_goal_progress": round(savings_goal_progress, 1),
            "active_fraud_alerts": active_fraud_alerts,
            "budgets_exceeded": budgets_exceeded
        }

        # Multi-month comparison (last 6 months)
        income_vs_expenses = []
        # Generate last 6 month keys
        for i in range(5, -1, -1):
            target_date = now - timedelta(days=i * 30)
            target_my = target_date.strftime("%Y-%m")
            target_label = target_date.strftime("%b")
            
            sub_df = df[df["month_year"] == target_my]
            inc = float(sub_df[sub_df["type"] == "income"]["amount"].sum())
            if inc == 0 and user.monthly_income:
                inc = float(user.monthly_income)
            exp = float(sub_df[sub_df["type"] == "expense"]["amount"].sum())
            sav = inc - exp

            income_vs_expenses.append({
                "month": target_label,
                "income": round(inc, 2),
                "expense": round(exp, 2),
                "savings": round(sav, 2)
            })

        # Category spending breakdown (current month or all time if current month empty)
        cat_df = current_month_df[current_month_df["type"] == "expense"]
        if len(cat_df) == 0:
            cat_df = df[df["type"] == "expense"]

        category_spending = []
        if len(cat_df) > 0:
            cat_grouped = cat_df.groupby("category")["amount"].sum().reset_index()
            total_cat_spend = float(cat_grouped["amount"].sum())

            for _, row in cat_grouped.sort_values(by="amount", ascending=False).iterrows():
                c_name = row["category"]
                c_amt = float(row["amount"])
                pct = (c_amt / total_cat_spend * 100) if total_cat_spend > 0 else 0
                category_spending.append({
                    "name": c_name,
                    "amount": round(c_amt, 2),
                    "percentage": round(pct, 1),
                    "color": CATEGORY_COLORS.get(c_name, "#94A3B8"),
                    "icon": CATEGORY_ICONS.get(c_name, "HelpCircle")
                })

        # Spending Trends (recent 15 expenses ordered by date)
        expenses_df = df[df["type"] == "expense"].sort_values(by="date", ascending=True)
        spending_trends = []
        for _, row in expenses_df.tail(15).iterrows():
            spending_trends.append({
                "date": row["date"].strftime("%d %b"),
                "amount": round(float(row["amount"]), 2),
                "category": row["category"]
            })

        return {
            "kpis": kpis,
            "income_vs_expenses": income_vs_expenses,
            "category_spending": category_spending,
            "spending_trends": spending_trends,
            "currency": user.currency or "USD"
        }

    def get_analytics_deep_dive(self, db: Session, user: User) -> Dict[str, Any]:
        """
        Advanced financial metrics: Month-over-month changes, daily averages,
        and projection models.
        """
        now = datetime.now(timezone.utc)
        transactions = db.query(Transaction).filter(Transaction.user_id == user.id).all()
        
        if not transactions:
            return {
                "month_over_month_change": 0.0,
                "top_spending_category": "None",
                "top_spending_category_amount": 0.0,
                "daily_average_expense": 0.0,
                "projected_end_of_month_expense": 0.0,
                "recurring_expenses_total": 0.0,
                "category_breakdown": [],
                "monthly_breakdown": []
            }

        df = pd.DataFrame([{
            "amount": float(t.amount),
            "type": t.type.lower(),
            "category": t.category,
            "date": t.date,
            "month_year": t.date.strftime("%Y-%m")
        } for t in transactions])

        current_my = now.strftime("%Y-%m")
        prev_my = (now - timedelta(days=31)).strftime("%Y-%m")

        cur_exp = float(df[(df["month_year"] == current_my) & (df["type"] == "expense")]["amount"].sum())
        prev_exp = float(df[(df["month_year"] == prev_my) & (df["type"] == "expense")]["amount"].sum())

        mom_change = ((cur_exp - prev_exp) / prev_exp * 100) if prev_exp > 0 else 0.0

        days_in_month = now.day or 1
        daily_avg = cur_exp / days_in_month
        projected = daily_avg * 30.0

        cat_exp = df[df["type"] == "expense"].groupby("category")["amount"].sum()
        top_cat = cat_exp.idxmax() if not cat_exp.empty else "None"
        top_cat_amt = float(cat_exp.max()) if not cat_exp.empty else 0.0

        summary = self.get_dashboard_summary(db, user)

        return {
            "month_over_month_change": round(mom_change, 1),
            "top_spending_category": top_cat,
            "top_spending_category_amount": round(top_cat_amt, 2),
            "daily_average_expense": round(daily_avg, 2),
            "projected_end_of_month_expense": round(projected, 2),
            "recurring_expenses_total": round(cur_exp * 0.42, 2), # estimated fixed baseline
            "category_breakdown": summary["category_spending"],
            "monthly_breakdown": summary["income_vs_expenses"]
        }

    def _empty_dashboard(self, user: User) -> Dict[str, Any]:
        return {
            "kpis": {
                "total_balance": 0.0,
                "monthly_income": float(user.monthly_income or 0.0),
                "monthly_expenses": 0.0,
                "total_savings": float(user.monthly_income or 0.0),
                "savings_rate": 100.0 if user.monthly_income else 0.0,
                "savings_goal": float(user.savings_goal or 20000.0),
                "savings_goal_progress": 0.0,
                "active_fraud_alerts": 0,
                "budgets_exceeded": 0
            },
            "income_vs_expenses": [],
            "category_spending": [],
            "spending_trends": [],
            "currency": user.currency or "USD"
        }

analytics_service = AnalyticsService()
