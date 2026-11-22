from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsDeepDiveResponse
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Financial Analytics"])

@router.get("/deep-dive", response_model=AnalyticsDeepDiveResponse)
def get_analytics_deep_dive(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_service.get_analytics_deep_dive(db, current_user)

@router.get("/report")
def get_downloadable_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = analytics_service.get_dashboard_summary(db, current_user)
    deep_dive = analytics_service.get_analytics_deep_dive(db, current_user)

    return {
        "report_generated_at": summary.get("currency"),
        "user_profile": {
            "name": current_user.full_name,
            "email": current_user.email,
            "currency": current_user.currency
        },
        "kpis": summary["kpis"],
        "deep_dive": deep_dive,
        "category_spending": summary["category_spending"],
        "income_vs_expenses": summary["income_vs_expenses"]
    }
