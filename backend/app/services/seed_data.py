from datetime import datetime, timezone, timedelta
import random
import json
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.fraud_alert import FraudAlert
from app.models.chat import ChatMessage
from app.core.security import get_password_hash

DEFAULT_CATEGORIES = [
    {"name": "Salary", "icon": "Briefcase", "color": "#10B981", "type": "income"},
    {"name": "Investments", "icon": "TrendingUp", "color": "#06B6D4", "type": "income"},
    {"name": "Freelance", "icon": "Laptop", "color": "#3B82F6", "type": "income"},
    {"name": "Food", "icon": "Utensils", "color": "#F59E0B", "type": "expense"},
    {"name": "Shopping", "icon": "ShoppingBag", "color": "#EC4899", "type": "expense"},
    {"name": "Travel", "icon": "Plane", "color": "#8B5CF6", "type": "expense"},
    {"name": "Education", "icon": "GraduationCap", "color": "#38BDF8", "type": "expense"},
    {"name": "Bills", "icon": "Zap", "color": "#EF4444", "type": "expense"},
    {"name": "Entertainment", "icon": "Film", "color": "#F97316", "type": "expense"},
    {"name": "Healthcare", "icon": "HeartPulse", "color": "#14B8A6", "type": "expense"},
    {"name": "Miscellaneous", "icon": "HelpCircle", "color": "#94A3B8", "type": "expense"}
]

def seed_database(db: Session):
    """
    Seeds default categories, a demo user, and 60+ realistic transactions
    across multiple months for instant rich dashboard visualization.
    """
    # 1. Seed Categories
    for cat in DEFAULT_CATEGORIES:
        existing = db.query(Category).filter(Category.name == cat["name"]).first()
        if not existing:
            db.add(Category(**cat))
    db.commit()

    # 2. Seed Demo User
    demo_email = "demo@finpilot.ai"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        user = User(
            email=demo_email,
            hashed_password=get_password_hash("password123"),
            full_name="Alex Mercer",
            currency="USD",
            monthly_income=6500.0,
            savings_goal=25000.0,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # If user already has transactions, don't duplicate
    tx_count = db.query(Transaction).filter(Transaction.user_id == user.id).count()
    if tx_count > 10:
        return user

    # 3. Seed Realistic Transactions across past 6 months
    now = datetime.now(timezone.utc)
    
    # Recurring income & expenses template per month
    months_ago_list = [5, 4, 3, 2, 1, 0] # June through November

    created_transactions = []

    for m_offset in months_ago_list:
        base_date = now - timedelta(days=m_offset * 30)
        
        # Monthly Salary
        sal_date = base_date.replace(day=1, hour=9, minute=0, second=0)
        t_sal = Transaction(
            user_id=user.id,
            title="Apex Fintech Corp - Monthly Payroll",
            amount=6500.0,
            type="income",
            category="Salary",
            date=sal_date,
            payment_method="Direct Deposit",
            notes="Senior Software Architect Compensation"
        )
        db.add(t_sal)
        created_transactions.append(t_sal)

        # Investment Dividend or Freelance
        if m_offset in [1, 3, 5]:
            t_inv = Transaction(
                user_id=user.id,
                title="Vanguard Index Dividend Payout",
                amount=340.50,
                type="income",
                category="Investments",
                date=base_date.replace(day=15, hour=10),
                payment_method="Bank Transfer",
                notes="VTSAX Quarterly Dividend"
            )
            db.add(t_inv)
            created_transactions.append(t_inv)

        # Monthly Rent / Mortgage
        t_rent = Transaction(
            user_id=user.id,
            title="Skyline Luxury Apartments - Rent",
            amount=1650.0,
            type="expense",
            category="Bills",
            date=base_date.replace(day=2, hour=11),
            payment_method="Bank Transfer",
            notes="Monthly Lease Payment"
        )
        db.add(t_rent)
        created_transactions.append(t_rent)

        # Utilities / Internet
        t_util = Transaction(
            user_id=user.id,
            title="City Power & Fiber Gigabit",
            amount=145.20,
            type="expense",
            category="Bills",
            date=base_date.replace(day=5, hour=14),
            payment_method="Card",
            notes="Electricity & Internet"
        )
        db.add(t_util)
        created_transactions.append(t_util)

        # Groceries
        for g_day, g_amt, g_store in [(6, 128.40, "Whole Foods Market"), (14, 164.75, "Trader Joe's"), (21, 142.10, "Kroger Organic"), (27, 98.30, "Sprouts Farmers Market")]:
            t_g = Transaction(
                user_id=user.id,
                title=g_store,
                amount=g_amt,
                type="expense",
                category="Food",
                date=base_date.replace(day=g_day, hour=17),
                payment_method="Card"
            )
            db.add(t_g)
            created_transactions.append(t_g)

        # Dining & Coffee
        for d_day, d_amt, d_place in [(4, 18.50, "Blue Bottle Coffee"), (9, 45.80, "Chipotle Mexican Grill"), (16, 78.20, "Trattoria Romana"), (22, 14.50, "Starbucks Reserve"), (25, 52.00, "Sushi Omakase")]:
            t_d = Transaction(
                user_id=user.id,
                title=d_place,
                amount=d_amt,
                type="expense",
                category="Food",
                date=base_date.replace(day=d_day, hour=19),
                payment_method="Card"
            )
            db.add(t_d)
            created_transactions.append(t_d)

        # Shopping
        for s_day, s_amt, s_item in [(8, 89.99, "Nike Running Shoes"), (18, 145.00, "Amazon Prime Essentials"), (24, 62.50, "Uniqlo Apparel")]:
            t_s = Transaction(
                user_id=user.id,
                title=s_item,
                amount=s_amt,
                type="expense",
                category="Shopping",
                date=base_date.replace(day=s_day, hour=15),
                payment_method="Card"
            )
            db.add(t_s)
            created_transactions.append(t_s)

        # Entertainment
        t_ent = Transaction(
            user_id=user.id,
            title="Netflix 4K Premium & Spotify Duo",
            amount=32.98,
            type="expense",
            category="Entertainment",
            date=base_date.replace(day=12, hour=12),
            payment_method="Card"
        )
        db.add(t_ent)
        created_transactions.append(t_ent)

        # Travel / Rideshare
        t_trv = Transaction(
            user_id=user.id,
            title="Uber Airport Rides & Metro Transit",
            amount=68.50,
            type="expense",
            category="Travel",
            date=base_date.replace(day=20, hour=8),
            payment_method="Card"
        )
        db.add(t_trv)
        created_transactions.append(t_trv)

    # 4. Insert Specific Flagged Anomaly Transactions in the current month for Fraud Detection testing
    suspicious_tx1 = Transaction(
        user_id=user.id,
        title="Apex Electronics MegaStore - 8K OLED TV",
        amount=3850.00,
        type="expense",
        category="Shopping",
        date=now - timedelta(days=2, hours=3),
        payment_method="Card",
        is_flagged=True,
        risk_score=88.0,
        risk_level="HIGH",
        notes="High-ticket offline terminal charge at unusual distance"
    )
    db.add(suspicious_tx1)

    suspicious_tx2 = Transaction(
        user_id=user.id,
        title="Binance Overseas Crypto Wire",
        amount=1200.00,
        type="expense",
        category="Investments",
        date=now - timedelta(days=3, hours=1),
        payment_method="Bank Transfer",
        is_flagged=True,
        risk_score=78.0,
        risk_level="HIGH",
        notes="Offshore wallet transfer request"
    )
    db.add(suspicious_tx2)

    suspicious_tx3_a = Transaction(
        user_id=user.id,
        title="Apple Services Subscription",
        amount=89.99,
        type="expense",
        category="Entertainment",
        date=now - timedelta(days=5, hours=10),
        payment_method="Card",
        is_flagged=True,
        risk_score=55.0,
        risk_level="MEDIUM",
        notes="Duplicate billing within 10 minutes"
    )
    db.add(suspicious_tx3_a)

    suspicious_tx3_b = Transaction(
        user_id=user.id,
        title="Apple Services Subscription",
        amount=89.99,
        type="expense",
        category="Entertainment",
        date=now - timedelta(days=5, hours=9, minutes=50),
        payment_method="Card",
        is_flagged=True,
        risk_score=55.0,
        risk_level="MEDIUM",
        notes="Duplicate billing within 10 minutes"
    )
    db.add(suspicious_tx3_b)

    db.commit()
    db.refresh(suspicious_tx1)
    db.refresh(suspicious_tx2)
    db.refresh(suspicious_tx3_a)

    # 5. Seed Corresponding FraudAlert records with explainable AI summaries
    alert1 = FraudAlert(
        user_id=user.id,
        transaction_id=suspicious_tx1.id,
        title="Apex Electronics MegaStore - 8K OLED TV",
        merchant="Apex Electronics MegaStore",
        amount=3850.00,
        date=suspicious_tx1.date.strftime("%Y-%m-%d %H:%M"),
        risk_score=88.0,
        risk_level="HIGH",
        rules_triggered=json.dumps([
            "Abnormal Amount Outlier: $3,850.00 is 5.2x standard deviations above user average ($142.10)",
            "High-Value Flat Amount: Single transaction exceeds 50% of monthly income"
        ]),
        ai_explanation="High Risk Alert (88/100): This transaction of $3,850.00 at Apex Electronics MegaStore represents an extreme statistical deviation from Alex's standard shopping patterns. It occurred outside usual transaction velocity and accounts for more than half of the user's monthly salary. Verification required.",
        status="PENDING"
    )
    db.add(alert1)

    alert2 = FraudAlert(
        user_id=user.id,
        transaction_id=suspicious_tx2.id,
        title="Binance Overseas Crypto Wire",
        merchant="Binance Overseas Crypto Wire",
        amount=1200.00,
        date=suspicious_tx2.date.strftime("%Y-%m-%d %H:%M"),
        risk_score=78.0,
        risk_level="HIGH",
        rules_triggered=json.dumps([
            "High-Risk Merchant/Entity Pattern: Contains keyword 'crypto'",
            "Offshore Wire Transfer Channel: International routing flagged"
        ]),
        ai_explanation="High Risk Alert (78/100): Outflow of $1,200.00 dispatched to an overseas cryptocurrency exchange gateway. This merchant entity has no historical baseline in this account. Please verify if you authorized this investment transfer.",
        status="PENDING"
    )
    db.add(alert2)

    alert3 = FraudAlert(
        user_id=user.id,
        transaction_id=suspicious_tx3_a.id,
        title="Apple Services Subscription",
        merchant="Apple Services Subscription",
        amount=89.99,
        date=suspicious_tx3_a.date.strftime("%Y-%m-%d %H:%M"),
        risk_score=55.0,
        risk_level="MEDIUM",
        rules_triggered=json.dumps([
            "Duplicate Charge Detected: Multiple identical $89.99 charges at 'Apple Services Subscription' within 10 minutes"
        ]),
        ai_explanation="Medium Risk Alert (55/100): Rapid duplicate charges of identical amount ($89.99) were processed back-to-back within a 10-minute window. This commonly signifies a payment gateway double-charge error or accidental checkout repetition.",
        status="PENDING"
    )
    db.add(alert3)

    # 6. Seed Realistic Monthly Budgets for the current month
    cur_my = now.strftime("%Y-%m")
    budget_configs = [
        {"category": "Food", "limit": 750.0},
        {"category": "Shopping", "limit": 600.0},
        {"category": "Bills", "limit": 1900.0},
        {"category": "Travel", "limit": 300.0},
        {"category": "Entertainment", "limit": 200.0},
        {"category": "Healthcare", "limit": 250.0}
    ]

    for b in budget_configs:
        existing_b = db.query(Budget).filter(
            Budget.user_id == user.id,
            Budget.category == b["category"],
            Budget.month_year == cur_my
        ).first()
        if not existing_b:
            db.add(Budget(
                user_id=user.id,
                category=b["category"],
                monthly_limit=b["limit"],
                month_year=cur_my
            ))

    # 7. Seed Initial AI Chat Welcome History
    welcome_chat = ChatMessage(
        user_id=user.id,
        role="assistant",
        content="Hello Alex! 👋 I am **FinPilot AI**, your personal financial copilot. I have analyzed your accounts, transactions, and budgets. You have a healthy **47% savings rate** this month, though you have **3 active risk alerts** in the Fraud Detection hub that need your eyes. What would you like to review today?"
    )
    db.add(welcome_chat)

    db.commit()
    return user
