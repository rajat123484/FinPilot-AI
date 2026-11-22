from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat import ChatMessage
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.fraud_alert import FraudAlert
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatResponse,
    QuickPrompt
)
from app.services.gemini_service import gemini_service
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

QUICK_PROMPTS = [
    QuickPrompt(id="top-spend", category="Analysis", prompt="Where did I spend most of my money this month?"),
    QuickPrompt(id="savings-potential", category="Savings", prompt="How much can I realistically save this month?"),
    QuickPrompt(id="habits-audit", category="Audit", prompt="Analyze my overall spending habits and financial health."),
    QuickPrompt(id="budget-plan", category="Planning", prompt="Suggest an optimized 50/30/20 monthly budget for my income."),
    QuickPrompt(id="trim-waste", category="Optimization", prompt="How can I reduce unnecessary expenses and recurring subscriptions?"),
    QuickPrompt(id="fraud-check", category="Security", prompt="Review my pending fraud and anomaly alerts.")
]

@router.get("/quick-prompts", response_model=List[QuickPrompt])
def get_quick_prompts():
    return QUICK_PROMPTS

@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc()).limit(limit).all()
    return messages

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    message_in: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_prompt = message_in.message.strip()
    if not user_prompt:
        raise HTTPException(status_code=400, detail="Message cannot be blank")

    # 1. Save user message to database
    user_msg_db = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=user_prompt
    )
    db.add(user_msg_db)
    db.commit()

    # 2. Extract real-time financial telemetry context for the user
    summary = analytics_service.get_dashboard_summary(db, current_user)
    kpis = summary["kpis"]
    top_cat = summary["category_spending"][0] if summary["category_spending"] else {"name": "None", "amount": 0}

    pending_alerts = db.query(FraudAlert).filter(
        FraudAlert.user_id == current_user.id,
        FraudAlert.status == "PENDING"
    ).count()

    system_context = (
        f"User Name: {current_user.full_name}\n"
        f"Currency: {current_user.currency or 'USD'}\n"
        f"Monthly Income: ${kpis['monthly_income']:,.2f}\n"
        f"Monthly Expenses: ${kpis['monthly_expenses']:,.2f}\n"
        f"Net Savings: ${kpis['total_savings']:,.2f}\n"
        f"Savings Rate: {kpis['savings_rate']}%\n"
        f"Top Expense Category: {top_cat['name']} (${top_cat['amount']:,.2f})\n"
        f"Active Fraud/Anomaly Alerts: {pending_alerts}\n"
        f"Total Account Balance: ${kpis['total_balance']:,.2f}\n"
    )

    # 3. Request AI synthesis from Gemini / Intelligent fallback engine
    ai_result = await gemini_service.generate_response(user_prompt, system_context)
    bot_reply = ai_result.get("text", "I have reviewed your financial telemetry. How else can I assist?")
    source = ai_result.get("source", "FinPilot Assistant")

    # 4. Save assistant response to database
    assistant_msg_db = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=bot_reply
    )
    db.add(assistant_msg_db)
    db.commit()

    return ChatResponse(
        message=bot_reply,
        source=source,
        quick_suggestions=[
            "How can I reduce food expenses?",
            "What is my emergency fund target?",
            "Show me top anomalies this month"
        ]
    )

@router.post("/reset-chat")
def reset_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    
    welcome_chat = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=f"Hello {current_user.full_name}! 👋 FinPilot AI assistant conversation reset. I am ready to analyze your finances. What would you like to explore?"
    )
    db.add(welcome_chat)
    db.commit()
    return {"message": "Chat history cleared"}
