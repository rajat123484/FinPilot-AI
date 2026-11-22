from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.fraud_alert import FraudAlert
from app.models.chat import ChatMessage
from app.schemas.user import UserUpdate, UserResponse
from app.services.gemini_service import gemini_service
from app.services.seed_data import seed_database

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/status")
def get_system_status(current_user: User = Depends(get_current_user)):
    has_key = gemini_service.has_api_key()
    return {
        "gemini_api_configured": has_key,
        "ai_engine": "Google Gemini 1.5/2.0 API" if has_key else "FinPilot Heuristic Financial AI (Demo Mode)",
        "currency": current_user.currency or "USD",
        "user": {
            "name": current_user.full_name,
            "email": current_user.email,
            "monthly_income": current_user.monthly_income,
            "savings_goal": current_user.savings_goal
        }
    }

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/set-gemini-key")
async def set_gemini_key(
    api_key: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    cleaned_key = api_key.strip()
    gemini_service.api_key = cleaned_key
    settings.GEMINI_API_KEY = cleaned_key

    # Test test key
    test_result = await gemini_service.generate_response("Test connection: confirm system status in 10 words.")

    return {
        "success": True,
        "configured": gemini_service.has_api_key(),
        "response_sample": test_result.get("text")[:80] + "...",
        "source": test_result.get("source")
    }

@router.post("/reset-demo-data")
def reset_demo_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clears transactions, budgets, fraud alerts, and chats for the current user
    and re-initializes fresh, balanced realistic demo telemetry.
    """
    db.query(FraudAlert).filter(FraudAlert.user_id == current_user.id).delete()
    db.query(Transaction).filter(Transaction.user_id == current_user.id).delete()
    db.query(Budget).filter(Budget.user_id == current_user.id).delete()
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()

    # Re-seed
    seed_database(db)

    return {"message": "Demo data successfully re-seeded with pristine state"}
