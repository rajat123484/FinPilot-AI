from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RuleTriggered(BaseModel):
    rule_name: str
    description: str
    severity: str # LOW, MEDIUM, HIGH

class FraudAlertResponse(BaseModel):
    id: int
    user_id: int
    transaction_id: Optional[int]
    title: str
    merchant: Optional[str]
    amount: float
    date: str
    risk_score: float
    risk_level: str
    rules_triggered: List[str]
    ai_explanation: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FraudOverviewResponse(BaseModel):
    total_analyzed: int
    flagged_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    overall_health_score: float # 0 - 100 (100 is cleanest)
    alerts: List[FraudAlertResponse]
